-- Plan personal: pasos por pilar según el nivel obtenido en el diagnóstico.
-- El plan se (re)genera en complete_diagnostic: lo completado se conserva y lo pendiente se recalcula.

create type public.score_level as enum ('low', 'medium', 'high');
create type public.plan_step_kind as enum ('action', 'lesson', 'challenge', 'session');

-- Mismos umbrales que scoreLevel() en app/features/diagnostic/data/diagnostic.ts (mantener en sincronía).
create function public.score_level(p_score integer)
returns public.score_level
language sql
immutable
set search_path = ''
as $$
  select case
    when p_score < 40 then 'low'::public.score_level
    when p_score < 70 then 'medium'::public.score_level
    else 'high'::public.score_level
  end;
$$;

-- Plantillas de pasos: a qué pilar pertenecen y para qué niveles aplican.
-- `kind` permitirá enlazar lecciones, retos o sesiones cuando existan (Fases 6–8).
create table public.plan_step_templates (
  id uuid primary key default gen_random_uuid(),
  pillar public.pillar not null,
  position smallint not null,
  levels public.score_level[] not null check (cardinality(levels) > 0),
  kind public.plan_step_kind not null default 'action',
  title jsonb not null check (public.is_localized_text(title)),
  description jsonb check (description is null or public.is_localized_text(description)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint plan_step_templates_pillar_position_key unique (pillar, position) deferrable initially deferred
);

-- Pasos del plan de cada usuario. Borrar una plantilla la quita de todos los planes.
create table public.plan_steps (
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid not null references public.plan_step_templates (id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, template_id)
);

create index plan_steps_template_id_idx on public.plan_steps (template_id);

-- Recalcula el plan con los puntajes de un intento: borra lo pendiente y agrega las plantillas
-- que aplican al nivel de cada pilar (las ya completadas se mantienen y no se duplican).
create function public.rebuild_plan(p_user_id uuid, p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.plan_steps
  where user_id = p_user_id and completed_at is null;

  insert into public.plan_steps (user_id, template_id)
  select p_user_id, t.id
  from public.diagnostic_scores s
  join public.plan_step_templates t
    on t.pillar = s.pillar
    and t.is_active
    and public.score_level(s.score) = any (t.levels)
  where s.attempt_id = p_attempt_id
  on conflict (user_id, template_id) do nothing;
end;
$$;

-- Solo de uso interno (complete_diagnostic)
revoke execute on function public.rebuild_plan(uuid, uuid) from public, anon, authenticated;

create or replace function public.complete_diagnostic(p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Valida antes de crear nada
  create temporary table scores on commit drop as
  select * from public.compute_diagnostic_scores(p_answers);

  insert into public.diagnostic_attempts (user_id)
  values (v_user_id)
  returning id into v_attempt_id;

  insert into public.diagnostic_answers (attempt_id, question_id, option_id)
  select v_attempt_id, a.question_id, a.option_id
  from jsonb_to_recordset(p_answers) as a (question_id uuid, option_id uuid);

  insert into public.diagnostic_scores (attempt_id, pillar, score)
  select v_attempt_id, s.pillar, s.score
  from pg_temp.scores s;

  perform public.rebuild_plan(v_user_id, v_attempt_id);

  update public.profiles
  set last_diagnostic_at = now()
  where id = v_user_id;

  return v_attempt_id;
end;
$$;

-- Permisos
revoke all on public.plan_step_templates, public.plan_steps from anon, authenticated;
grant select, insert, update, delete on public.plan_step_templates to authenticated;
grant select on public.plan_steps to authenticated;
-- El usuario solo marca/desmarca pasos como completados
grant update (completed_at) on public.plan_steps to authenticated;

alter table public.plan_step_templates enable row level security;
alter table public.plan_steps enable row level security;

create policy "Users can read active plan templates"
  on public.plan_step_templates for select to authenticated
  using (is_active or (select public.is_admin()));
create policy "Admins can insert plan templates"
  on public.plan_step_templates for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update plan templates"
  on public.plan_step_templates for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete plan templates"
  on public.plan_step_templates for delete to authenticated
  using ((select public.is_admin()));

create policy "Users can read their own plan, admins all"
  on public.plan_steps for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users can complete their own plan steps"
  on public.plan_steps for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
