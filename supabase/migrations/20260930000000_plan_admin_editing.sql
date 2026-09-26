-- Edición de los pasos del plan desde el panel de admin.
-- Regla: cambiar la ruta nunca le quita progreso a un usuario. Los cambios (pasos nuevos,
-- niveles, desactivar) aplican a los planes que se generen desde ahora; los planes existentes
-- conservan sus pasos. Los textos sí se actualizan para todos (es la misma plantilla).

-- Un paso que ya está en algún plan no se puede borrar (antes se borraba en cascada de todos los planes)
alter table public.plan_steps
  drop constraint plan_steps_template_id_fkey,
  add constraint plan_steps_template_id_fkey
    foreign key (template_id) references public.plan_step_templates (id) on delete restrict;

-- El usuario sigue viendo los pasos de su plan aunque el admin los desactive
drop policy "Users can read active plan templates" on public.plan_step_templates;
create policy "Users can read active plan templates and those in their plan"
  on public.plan_step_templates for select to authenticated
  using (
    is_active
    or (select public.is_admin())
    or exists (
      select 1 from public.plan_steps s
      where s.template_id = plan_step_templates.id and s.user_id = (select auth.uid())
    )
  );

-- Borrar solo con admin_delete_plan_step_template (que verifica que no esté en ningún plan)
drop policy "Admins can delete plan templates" on public.plan_step_templates;
revoke delete on public.plan_step_templates from authenticated;

-- Niveles válidos: al menos uno y sin repetidos
create function public.is_valid_plan_step_levels(p_levels public.score_level[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_levels is not null
    and cardinality(p_levels) > 0
    and cardinality(p_levels) = (select count(distinct l) from unnest(p_levels) as l);
$$;

create function public.admin_create_plan_step_template(
  p_pillar public.pillar,
  p_title jsonb,
  p_description jsonb,
  p_levels public.score_level[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not public.is_localized_text(p_title)
    or (p_description is not null and not public.is_localized_text(p_description))
    or not public.is_valid_plan_step_levels(p_levels) then
    raise exception 'invalid plan step' using errcode = '22023';
  end if;

  -- Serializa las altas del pilar para calcular la posición sin carreras
  perform pg_advisory_xact_lock(hashtext('plan_step_templates:' || p_pillar::text));

  insert into public.plan_step_templates (pillar, position, levels, title, description)
  values (
    p_pillar,
    coalesce((select max(position) from public.plan_step_templates where pillar = p_pillar), 0) + 1,
    p_levels,
    p_title,
    p_description
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- p_ids: todos los pasos del pilar en el nuevo orden. Las posiciones quedan 1..n.
create function public.admin_reorder_plan_step_templates(p_pillar public.pillar, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if cardinality(p_ids) is distinct from (select count(*) from public.plan_step_templates where pillar = p_pillar)
    or cardinality(p_ids) <> (select count(distinct t.tid) from unnest(p_ids) as t (tid))
    or exists (
      select 1 from unnest(p_ids) as t (tid)
      where not exists (
        select 1 from public.plan_step_templates p
        where p.id = t.tid and p.pillar = p_pillar
      )
    ) then
    raise exception 'ids must be exactly the plan steps of the pillar' using errcode = '22023';
  end if;

  update public.plan_step_templates p
  set position = o.ordinality
  from unnest(p_ids) with ordinality as o (tid, ordinality)
  where p.id = o.tid;
end;
$$;

-- Solo se borra un paso que no está en ningún plan (p. ej. uno recién creado por error).
-- Si ya lo tiene algún usuario, se desactiva en su lugar.
create function public.admin_delete_plan_step_template(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform 1 from public.plan_step_templates where id = p_id for update;
  if not found then
    raise exception 'plan step not found' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.plan_steps where template_id = p_id) then
    raise exception 'plan step is in use' using errcode = '23503', hint = 'plan_step_in_use';
  end if;

  delete from public.plan_step_templates where id = p_id;
end;
$$;

-- En cuántos planes está cada paso (dato agregado: el admin no ve los planes de los usuarios)
create function public.admin_plan_step_usage()
returns table (template_id uuid, users integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select s.template_id, count(*)::integer
  from public.plan_steps s
  group by s.template_id;
end;
$$;

-- También para las ediciones directas (update de levels)
alter table public.plan_step_templates
  add constraint plan_step_templates_levels_valid check (public.is_valid_plan_step_levels(levels));

revoke execute on function public.is_valid_plan_step_levels(public.score_level[]) from public, anon;
revoke execute on function public.admin_create_plan_step_template(public.pillar, jsonb, jsonb, public.score_level[]) from public, anon;
revoke execute on function public.admin_reorder_plan_step_templates(public.pillar, uuid[]) from public, anon;
revoke execute on function public.admin_delete_plan_step_template(uuid) from public, anon;
revoke execute on function public.admin_plan_step_usage() from public, anon;

grant execute on function public.admin_create_plan_step_template(public.pillar, jsonb, jsonb, public.score_level[]) to authenticated;
grant execute on function public.admin_reorder_plan_step_templates(public.pillar, uuid[]) to authenticated;
grant execute on function public.admin_delete_plan_step_template(uuid) to authenticated;
grant execute on function public.admin_plan_step_usage() to authenticated;
