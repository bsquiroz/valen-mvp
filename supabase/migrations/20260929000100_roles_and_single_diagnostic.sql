-- Roles: admin = editor de contenido; super_admin = todo (datos de usuarios y gestión de admins).
-- Diagnóstico: se responde una sola vez; solo un desarrollador puede habilitar otro intento.

-- La cuenta admin existente pasa a ser el super admin
update public.profiles set role = 'super_admin' where role = 'admin';

-- Un solo super admin
create unique index profiles_single_super_admin_idx
  on public.profiles ((true))
  where role = 'super_admin';

-- is_admin(): acceso al contenido (admin y super_admin)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'super_admin')
  );
$$;

-- is_super_admin(): datos de los usuarios y gestión de cuentas
create function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'super_admin'
  );
$$;

revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- Los datos de los usuarios solo los ve el super admin
drop policy "Users can read their own profile, admins all" on public.profiles;
create policy "Users can read their own profile, super admin all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_super_admin()));

drop policy "Users can read their own attempts" on public.diagnostic_attempts;
create policy "Users can read their own attempts"
  on public.diagnostic_attempts for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_super_admin()));

drop policy "Users can read their own answers" on public.diagnostic_answers;
create policy "Users can read their own answers"
  on public.diagnostic_answers for select to authenticated
  using (exists (
    select 1 from public.diagnostic_attempts a
    where a.id = attempt_id and (a.user_id = (select auth.uid()) or (select public.is_super_admin()))
  ));

drop policy "Users can read their own scores" on public.diagnostic_scores;
create policy "Users can read their own scores"
  on public.diagnostic_scores for select to authenticated
  using (exists (
    select 1 from public.diagnostic_attempts a
    where a.id = attempt_id and (a.user_id = (select auth.uid()) or (select public.is_super_admin()))
  ));

drop policy "Users can read their own plan, admins all" on public.plan_steps;
create policy "Users can read their own plan, super admin all"
  on public.plan_steps for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_super_admin()));

-- Lista de admins con su correo (auth.users no es accesible desde el cliente)
create function public.super_admin_list_admins()
returns table (id uuid, email text, display_name text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select p.id, u.email::text, p.display_name, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'admin'
  order by p.created_at;
end;
$$;

revoke execute on function public.super_admin_list_admins() from public, anon;
grant execute on function public.super_admin_list_admins() to authenticated;

-- Diagnóstico de un solo intento. Un desarrollador habilita otro con dev_allow_diagnostic_retake.
alter table public.profiles
  add column diagnostic_retake_allowed boolean not null default false;

create or replace function public.complete_diagnostic(p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_already_completed boolean;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Bloquea el perfil para que dos envíos simultáneos no creen dos intentos
  select last_diagnostic_at is not null and not diagnostic_retake_allowed
  into v_already_completed
  from public.profiles
  where id = v_user_id
  for update;

  if v_already_completed then
    raise exception 'diagnostic already completed' using errcode = 'P0001', hint = 'diagnostic_already_completed';
  end if;

  -- Valida antes de crear nada (lanza 22023 si las respuestas no son válidas)
  perform 1 from public.compute_diagnostic_scores(p_answers);

  insert into public.diagnostic_attempts (user_id)
  values (v_user_id)
  returning id into v_attempt_id;

  insert into public.diagnostic_answers (attempt_id, question_id, option_id)
  select v_attempt_id, a.question_id, a.option_id
  from jsonb_to_recordset(p_answers) as a (question_id uuid, option_id uuid);

  insert into public.diagnostic_scores (attempt_id, pillar, score)
  select v_attempt_id, s.pillar, s.score
  from public.compute_diagnostic_scores(p_answers) s;

  perform public.rebuild_plan(v_user_id, v_attempt_id);

  update public.profiles
  set last_diagnostic_at = now(), diagnostic_retake_allowed = false
  where id = v_user_id;

  return v_attempt_id;
end;
$$;

-- Solo para desarrolladores (SQL Editor o service role):
--   select public.dev_allow_diagnostic_retake('<user_id>');
-- El intento anterior, el historial y los pasos completados del plan se conservan.
create function public.dev_allow_diagnostic_retake(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set diagnostic_retake_allowed = true
  where id = p_user_id;

  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.dev_allow_diagnostic_retake(uuid) from public, anon, authenticated;
