-- Editores de admin (diagnóstico y pasos del plan) con borrador local: el admin hace todos los
-- cambios y pulsa "Guardar cambios". Cada editor envía su estado completo en una sola llamada;
-- la base compara con lo guardado, escribe solo lo que cambió y aplica todo o nada.
-- Reemplaza las RPC de una operación por llamada.

-- Reordenar/borrar opciones renumera varias filas: la unicidad se verifica al final de la transacción
alter table public.diagnostic_options
  drop constraint diagnostic_options_question_id_position_key,
  add constraint diagnostic_options_question_id_position_key
    unique (question_id, position) deferrable initially deferred;

-- p_questions: todas las preguntas activas, en orden dentro de cada pilar:
-- [{"id": uuid|null, "pillar": pillar, "prompt": {"es","en"},
--   "options": [{"id": uuid|null, "label": {"es","en"}, "score": 0..3}, ...]}, ...]
-- id null = nueva. Las preguntas u opciones que no vienen se borran (y con ellas lo que los
-- usuarios respondieron; los puntajes ya calculados se conservan).
create function public.admin_save_diagnostic(p_questions jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question record;
  v_option record;
  v_question_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'questions must be an array' using errcode = '22023';
  end if;

  -- Forma y reglas de cada pregunta y opción
  if exists (
    select 1 from jsonb_array_elements(p_questions) q
    where jsonb_typeof(q) is distinct from 'object'
      or not coalesce(q ->> 'pillar' = any (enum_range(null::public.pillar)::text[]), false)
      or not public.is_localized_text(q -> 'prompt')
      or jsonb_typeof(q -> 'options') is distinct from 'array'
      or jsonb_array_length(q -> 'options') not between 2 and 6
      or exists (
        select 1 from jsonb_array_elements(q -> 'options') o
        where not public.is_valid_diagnostic_option(o)
      )
  ) then
    raise exception 'invalid questions' using errcode = '22023';
  end if;

  -- Los ids existentes deben ser únicos, estar activos y conservar su pilar (y las opciones, su pregunta)
  if exists (
    select 1 from jsonb_array_elements(p_questions) q
    where q ->> 'id' is not null
      and not exists (
        select 1 from public.diagnostic_questions dq
        where dq.id = (q ->> 'id')::uuid and dq.is_active and dq.pillar::text = q ->> 'pillar'
      )
  )
  or (select count(q ->> 'id') <> count(distinct q ->> 'id') from jsonb_array_elements(p_questions) q)
  or exists (
    select 1 from jsonb_array_elements(p_questions) q, jsonb_array_elements(q -> 'options') o
    where o ->> 'id' is not null
      and not exists (
        select 1 from public.diagnostic_options dop
        where dop.id = (o ->> 'id')::uuid and dop.question_id = (q ->> 'id')::uuid
      )
  )
  or (
    select count(o ->> 'id') <> count(distinct o ->> 'id')
    from jsonb_array_elements(p_questions) q, jsonb_array_elements(q -> 'options') o
  ) then
    raise exception 'unknown or duplicate ids' using errcode = '22023';
  end if;

  -- Un guardado a la vez
  perform pg_advisory_xact_lock(hashtext('admin_save_diagnostic'));

  delete from public.diagnostic_questions dq
  where dq.is_active
    and not exists (
      select 1 from jsonb_array_elements(p_questions) q
      where (q ->> 'id')::uuid = dq.id
    );

  for v_question in
    select q.value as data,
      row_number() over (partition by q.value ->> 'pillar' order by q.ordinality)::smallint as position
    from jsonb_array_elements(p_questions) with ordinality as q
  loop
    v_question_id := (v_question.data ->> 'id')::uuid;

    if v_question_id is null then
      insert into public.diagnostic_questions (pillar, position, prompt)
      values ((v_question.data ->> 'pillar')::public.pillar, v_question.position, v_question.data -> 'prompt')
      returning id into v_question_id;
    else
      update public.diagnostic_questions
      set position = v_question.position, prompt = v_question.data -> 'prompt'
      where id = v_question_id
        and (position, prompt) is distinct from (v_question.position, v_question.data -> 'prompt');

      delete from public.diagnostic_options dop
      where dop.question_id = v_question_id
        and not exists (
          select 1 from jsonb_array_elements(v_question.data -> 'options') o
          where (o ->> 'id')::uuid = dop.id
        );
    end if;

    for v_option in
      select o.value as data, o.ordinality::smallint as position
      from jsonb_array_elements(v_question.data -> 'options') with ordinality as o
    loop
      if v_option.data ->> 'id' is null then
        insert into public.diagnostic_options (question_id, position, label, score)
        values (v_question_id, v_option.position, v_option.data -> 'label', (v_option.data ->> 'score')::smallint);
      else
        update public.diagnostic_options
        set position = v_option.position,
          label = v_option.data -> 'label',
          score = (v_option.data ->> 'score')::smallint
        where id = (v_option.data ->> 'id')::uuid
          and (position, label, score) is distinct from
            (v_option.position, v_option.data -> 'label', (v_option.data ->> 'score')::smallint);
      end if;
    end loop;
  end loop;
end;
$$;

-- p_steps: todos los pasos (activos e inactivos), en orden dentro de cada pilar:
-- [{"id": uuid|null, "pillar": pillar, "title": {"es","en"}, "description": {"es","en"}|null,
--   "levels": ["low"|"medium"|"high", ...], "is_active": boolean}, ...]
-- id null = nuevo. Un paso que no viene se borra solo si no está en ningún plan; si no, falla todo.
create function public.admin_save_plan_steps(p_steps jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_step record;
  v_levels public.score_level[];
  v_description jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if jsonb_typeof(p_steps) is distinct from 'array' then
    raise exception 'steps must be an array' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_steps) s
    where jsonb_typeof(s) is distinct from 'object'
      or not coalesce(s ->> 'pillar' = any (enum_range(null::public.pillar)::text[]), false)
      or not public.is_localized_text(s -> 'title')
      or not (coalesce(jsonb_typeof(s -> 'description'), 'null') = 'null' or public.is_localized_text(s -> 'description'))
      or jsonb_typeof(s -> 'is_active') is distinct from 'boolean'
      or jsonb_typeof(s -> 'levels') is distinct from 'array'
      or exists (
        select 1 from jsonb_array_elements(s -> 'levels') l
        where not coalesce(l #>> '{}' = any (enum_range(null::public.score_level)::text[]), false)
      )
  ) then
    raise exception 'invalid steps' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_steps) s
    where s ->> 'id' is not null
      and not exists (
        select 1 from public.plan_step_templates t
        where t.id = (s ->> 'id')::uuid and t.pillar::text = s ->> 'pillar'
      )
  )
  or (select count(s ->> 'id') <> count(distinct s ->> 'id') from jsonb_array_elements(p_steps) s) then
    raise exception 'unknown or duplicate ids' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('admin_save_plan_steps'));

  -- Cambiar la ruta nunca le quita progreso a un usuario: lo que está en algún plan no se borra
  if exists (
    select 1 from public.plan_step_templates t
    where not exists (select 1 from jsonb_array_elements(p_steps) s where (s ->> 'id')::uuid = t.id)
      and exists (select 1 from public.plan_steps ps where ps.template_id = t.id)
  ) then
    raise exception 'plan step is in use' using errcode = '23503', hint = 'plan_step_in_use';
  end if;

  delete from public.plan_step_templates t
  where not exists (select 1 from jsonb_array_elements(p_steps) s where (s ->> 'id')::uuid = t.id);

  for v_step in
    select s.value as data,
      row_number() over (partition by s.value ->> 'pillar' order by s.ordinality)::smallint as position
    from jsonb_array_elements(p_steps) with ordinality as s
  loop
    v_levels := array(select jsonb_array_elements_text(v_step.data -> 'levels'))::public.score_level[];
    v_description := nullif(v_step.data -> 'description', 'null'::jsonb);

    if not public.is_valid_plan_step_levels(v_levels) then
      raise exception 'invalid levels' using errcode = '22023';
    end if;

    if v_step.data ->> 'id' is null then
      insert into public.plan_step_templates (pillar, position, levels, title, description, is_active)
      values (
        (v_step.data ->> 'pillar')::public.pillar,
        v_step.position,
        v_levels,
        v_step.data -> 'title',
        v_description,
        (v_step.data ->> 'is_active')::boolean
      );
    else
      update public.plan_step_templates
      set position = v_step.position,
        levels = v_levels,
        title = v_step.data -> 'title',
        description = v_description,
        is_active = (v_step.data ->> 'is_active')::boolean
      where id = (v_step.data ->> 'id')::uuid
        and (position, levels, title, description, is_active) is distinct from
          (v_step.position, v_levels, v_step.data -> 'title', v_description, (v_step.data ->> 'is_active')::boolean);
    end if;
  end loop;
end;
$$;

-- Las escrituras de contenido van solo por estas RPC
drop function public.admin_create_diagnostic_question(public.pillar, jsonb, jsonb);
drop function public.admin_add_diagnostic_option(uuid, jsonb, smallint);
drop function public.admin_delete_diagnostic_option(uuid);
drop function public.admin_reorder_diagnostic_questions(public.pillar, uuid[]);
drop function public.admin_create_plan_step_template(public.pillar, jsonb, jsonb, public.score_level[]);
drop function public.admin_reorder_plan_step_templates(public.pillar, uuid[]);
drop function public.admin_delete_plan_step_template(uuid);

drop policy "Admins can insert questions" on public.diagnostic_questions;
drop policy "Admins can update questions" on public.diagnostic_questions;
drop policy "Admins can delete questions" on public.diagnostic_questions;
drop policy "Admins can insert options" on public.diagnostic_options;
drop policy "Admins can update options" on public.diagnostic_options;
drop policy "Admins can insert plan templates" on public.plan_step_templates;
drop policy "Admins can update plan templates" on public.plan_step_templates;

revoke insert, update, delete on public.diagnostic_questions, public.diagnostic_options, public.plan_step_templates
  from authenticated;

revoke execute on function public.admin_save_diagnostic(jsonb) from public, anon;
revoke execute on function public.admin_save_plan_steps(jsonb) from public, anon;
grant execute on function public.admin_save_diagnostic(jsonb) to authenticated;
grant execute on function public.admin_save_plan_steps(jsonb) to authenticated;
