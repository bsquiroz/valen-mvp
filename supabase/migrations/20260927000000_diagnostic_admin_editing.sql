-- Edición del diagnóstico desde el panel de admin: crear, editar, borrar y reordenar.

-- Borrar una pregunta u opción borra también lo que los usuarios respondieron en ella.
-- Los puntajes ya calculados (diagnostic_scores) no dependen de estas filas y se conservan.
alter table public.diagnostic_answers
  drop constraint diagnostic_answers_question_id_fkey,
  add constraint diagnostic_answers_question_id_fkey
    foreign key (question_id) references public.diagnostic_questions (id) on delete cascade;

alter table public.diagnostic_answers
  drop constraint diagnostic_answers_option_id_fkey,
  add constraint diagnostic_answers_option_id_fkey
    foreign key (option_id) references public.diagnostic_options (id) on delete cascade;

-- Reordenar renumera varias filas a la vez: la unicidad se verifica al final de la transacción.
alter table public.diagnostic_questions
  drop constraint diagnostic_questions_pillar_position_key,
  add constraint diagnostic_questions_pillar_position_key
    unique (pillar, position) deferrable initially deferred;

-- Opción válida: {"label": {"es", "en"}, "score": 0..3}
create function public.is_valid_diagnostic_option(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
    and public.is_localized_text(value -> 'label')
    and jsonb_typeof(value -> 'score') = 'number'
    and (value ->> 'score') ~ '^[0-3]$';
$$;

create function public.admin_create_diagnostic_question(p_pillar public.pillar, p_prompt jsonb, p_options jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not public.is_localized_text(p_prompt) then
    raise exception 'invalid prompt' using errcode = '22023';
  end if;

  if jsonb_typeof(p_options) is distinct from 'array'
    or jsonb_array_length(p_options) not between 2 and 6
    or exists (select 1 from jsonb_array_elements(p_options) o where not public.is_valid_diagnostic_option(o)) then
    raise exception 'invalid options' using errcode = '22023';
  end if;

  insert into public.diagnostic_questions (pillar, position, prompt)
  values (
    p_pillar,
    coalesce((select max(position) from public.diagnostic_questions where pillar = p_pillar), 0) + 1,
    p_prompt
  )
  returning id into v_question_id;

  insert into public.diagnostic_options (question_id, position, label, score)
  select v_question_id, o.ordinality::smallint, o.value -> 'label', (o.value ->> 'score')::smallint
  from jsonb_array_elements(p_options) with ordinality as o;

  return v_question_id;
end;
$$;

create function public.admin_add_diagnostic_option(p_question_id uuid, p_label jsonb, p_score smallint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_option_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Bloquea la pregunta para calcular la posición sin carreras
  perform 1 from public.diagnostic_questions where id = p_question_id for update;
  if not found then
    raise exception 'question not found' using errcode = 'P0002';
  end if;

  if (select count(*) from public.diagnostic_options where question_id = p_question_id) >= 6 then
    raise exception 'too many options' using errcode = '22023';
  end if;

  insert into public.diagnostic_options (question_id, position, label, score)
  values (
    p_question_id,
    coalesce((select max(position) from public.diagnostic_options where question_id = p_question_id), 0) + 1,
    p_label,
    p_score
  )
  returning id into v_option_id;

  return v_option_id;
end;
$$;

create function public.admin_delete_diagnostic_option(p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select question_id into v_question_id from public.diagnostic_options where id = p_option_id;
  if v_question_id is null then
    raise exception 'option not found' using errcode = 'P0002';
  end if;

  perform 1 from public.diagnostic_questions where id = v_question_id for update;

  if (select count(*) from public.diagnostic_options where question_id = v_question_id) <= 2 then
    raise exception 'a question needs at least two options' using errcode = '22023';
  end if;

  delete from public.diagnostic_options where id = p_option_id;
end;
$$;

-- p_ids: todas las preguntas del pilar en el nuevo orden. Las posiciones quedan 1..n.
create function public.admin_reorder_diagnostic_questions(p_pillar public.pillar, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if cardinality(p_ids) is distinct from (select count(*) from public.diagnostic_questions where pillar = p_pillar)
    or cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) as id)
    or exists (
      select 1 from unnest(p_ids) as id
      where not exists (select 1 from public.diagnostic_questions q where q.id = id and q.pillar = p_pillar)
    ) then
    raise exception 'ids must be exactly the questions of the pillar' using errcode = '22023';
  end if;

  update public.diagnostic_questions q
  set position = o.ordinality
  from unnest(p_ids) with ordinality as o (id, ordinality)
  where q.id = o.id;
end;
$$;

-- Borrar opciones solo por admin_delete_diagnostic_option (que garantiza el mínimo de 2)
revoke delete on public.diagnostic_options from authenticated;

revoke execute on function public.is_valid_diagnostic_option(jsonb) from public, anon;
revoke execute on function public.admin_create_diagnostic_question(public.pillar, jsonb, jsonb) from public, anon;
revoke execute on function public.admin_add_diagnostic_option(uuid, jsonb, smallint) from public, anon;
revoke execute on function public.admin_delete_diagnostic_option(uuid) from public, anon;
revoke execute on function public.admin_reorder_diagnostic_questions(public.pillar, uuid[]) from public, anon;

grant execute on function public.admin_create_diagnostic_question(public.pillar, jsonb, jsonb) to authenticated;
grant execute on function public.admin_add_diagnostic_option(uuid, jsonb, smallint) to authenticated;
grant execute on function public.admin_delete_diagnostic_option(uuid) to authenticated;
grant execute on function public.admin_reorder_diagnostic_questions(public.pillar, uuid[]) to authenticated;
