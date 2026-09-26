-- Retos: ejercicios prácticos por pilar con seguimiento diario.
-- El usuario empieza un reto y hace un check-in por día; se completa al acumular los días del
-- reto (target_days, fijado al empezar). Check-ins y completado los calcula la base.
-- Regla: editar nunca quita progreso. Un reto que alguien empezó no se borra (se desactiva) y
-- quien lo empezó lo sigue viendo.

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  pillar public.pillar not null,
  position smallint not null,
  title jsonb not null check (public.is_localized_text(title)),
  description jsonb not null check (public.is_localized_text(description)),
  -- 1 = se hace una sola vez
  duration_days smallint not null check (duration_days between 1 and 90),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint challenges_pillar_position_key unique (pillar, position) deferrable initially deferred
);

create table public.challenge_enrollments (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete restrict,
  -- Días necesarios, copiados del reto al empezar (cambios posteriores del admin no afectan)
  target_days smallint not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);

create index challenge_enrollments_challenge_id_idx on public.challenge_enrollments (challenge_id);

create table public.challenge_checkins (
  user_id uuid not null,
  challenge_id uuid not null,
  -- Fecha local del usuario
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, challenge_id, day),
  foreign key (user_id, challenge_id) references public.challenge_enrollments (user_id, challenge_id) on delete cascade
);

-- Auxiliar para la RLS de challenges sin recursión
create function public.enrolled_in_challenge(p_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.challenge_enrollments
    where challenge_id = p_challenge_id and user_id = (select auth.uid())
  );
$$;

-- Empezar un reto activo (idempotente). La duración se copia del reto.
create function public.start_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_days smallint;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select duration_days into v_days
  from public.challenges
  where id = p_challenge_id and is_active;
  if v_days is null then
    raise exception 'challenge not found' using errcode = 'P0002';
  end if;

  insert into public.challenge_enrollments (user_id, challenge_id, target_days)
  values (v_user_id, p_challenge_id, v_days)
  on conflict (user_id, challenge_id) do nothing;
end;
$$;

-- Check-in del día (fecha local del usuario, con ±1 día de margen por zona horaria).
-- Un check-in por día; al llegar a target_days el reto queda completado.
create function public.challenge_check_in(p_challenge_id uuid, p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_enrollment public.challenge_enrollments;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_day is null or p_day not between current_date - 1 and current_date + 1 then
    raise exception 'invalid day' using errcode = '22023';
  end if;

  select * into v_enrollment
  from public.challenge_enrollments
  where user_id = v_user_id and challenge_id = p_challenge_id
  for update;

  if not found then
    raise exception 'not enrolled' using errcode = 'P0002';
  end if;
  if v_enrollment.completed_at is not null then
    return;
  end if;

  insert into public.challenge_checkins (user_id, challenge_id, day)
  values (v_user_id, p_challenge_id, p_day)
  on conflict do nothing;

  if (select count(*) from public.challenge_checkins
      where user_id = v_user_id and challenge_id = p_challenge_id) >= v_enrollment.target_days then
    update public.challenge_enrollments
    set completed_at = now()
    where user_id = v_user_id and challenge_id = p_challenge_id;
  end if;
end;
$$;

-- Admin: cuántos usuarios empezaron y completaron cada reto (dato agregado)
create function public.admin_challenge_usage()
returns table (challenge_id uuid, started integer, completed integer)
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
  select e.challenge_id, count(*)::integer, count(e.completed_at)::integer
  from public.challenge_enrollments e
  group by e.challenge_id;
end;
$$;

-- Guarda el borrador del editor de retos en una sola llamada (todo o nada; solo escribe lo que cambió).
-- p_challenges: todos los retos, en orden dentro de cada pilar:
-- [{"id": uuid|null, "pillar": pillar, "title": {"es","en"}, "description": {"es","en"},
--   "duration_days": 1..90, "is_active": boolean}, ...]
-- Lo que no viene se borra, salvo retos que alguien empezó (falla todo: hay que desactivarlos).
create function public.admin_save_challenges(p_challenges jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge record;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if jsonb_typeof(p_challenges) is distinct from 'array' then
    raise exception 'challenges must be an array' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_challenges) c
    where jsonb_typeof(c) is distinct from 'object'
      or not coalesce(c ->> 'pillar' = any (enum_range(null::public.pillar)::text[]), false)
      or not public.is_localized_text(c -> 'title')
      or not public.is_localized_text(c -> 'description')
      or jsonb_typeof(c -> 'duration_days') is distinct from 'number'
      or not coalesce((c ->> 'duration_days') ~ '^[0-9]{1,2}$' and (c ->> 'duration_days')::integer between 1 and 90, false)
      or jsonb_typeof(c -> 'is_active') is distinct from 'boolean'
  ) then
    raise exception 'invalid challenges' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_challenges) c
    where c ->> 'id' is not null
      and not exists (
        select 1 from public.challenges ch
        where ch.id = (c ->> 'id')::uuid and ch.pillar::text = c ->> 'pillar'
      )
  )
  or (select count(c ->> 'id') <> count(distinct c ->> 'id') from jsonb_array_elements(p_challenges) c) then
    raise exception 'unknown or duplicate ids' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('admin_save_challenges'));

  if exists (
    select 1 from public.challenges ch
    where not exists (select 1 from jsonb_array_elements(p_challenges) c where (c ->> 'id')::uuid = ch.id)
      and exists (select 1 from public.challenge_enrollments e where e.challenge_id = ch.id)
  ) then
    raise exception 'challenge is in use' using errcode = '23503', hint = 'challenge_in_use';
  end if;

  delete from public.challenges ch
  where not exists (select 1 from jsonb_array_elements(p_challenges) c where (c ->> 'id')::uuid = ch.id);

  for v_challenge in
    select c.value as data,
      row_number() over (partition by c.value ->> 'pillar' order by c.ordinality)::smallint as position
    from jsonb_array_elements(p_challenges) with ordinality as c
  loop
    if v_challenge.data ->> 'id' is null then
      insert into public.challenges (pillar, position, title, description, duration_days, is_active)
      values (
        (v_challenge.data ->> 'pillar')::public.pillar,
        v_challenge.position,
        v_challenge.data -> 'title',
        v_challenge.data -> 'description',
        (v_challenge.data ->> 'duration_days')::smallint,
        (v_challenge.data ->> 'is_active')::boolean
      );
    else
      update public.challenges
      set position = v_challenge.position,
        title = v_challenge.data -> 'title',
        description = v_challenge.data -> 'description',
        duration_days = (v_challenge.data ->> 'duration_days')::smallint,
        is_active = (v_challenge.data ->> 'is_active')::boolean
      where id = (v_challenge.data ->> 'id')::uuid
        and (position, title, description, duration_days, is_active) is distinct from (
          v_challenge.position,
          v_challenge.data -> 'title',
          v_challenge.data -> 'description',
          (v_challenge.data ->> 'duration_days')::smallint,
          (v_challenge.data ->> 'is_active')::boolean
        );
    end if;
  end loop;
end;
$$;

-- Permisos: lectura; toda escritura por RPC
revoke all on public.challenges, public.challenge_enrollments, public.challenge_checkins from anon, authenticated;
grant select on public.challenges, public.challenge_enrollments, public.challenge_checkins to authenticated;

alter table public.challenges enable row level security;
alter table public.challenge_enrollments enable row level security;
alter table public.challenge_checkins enable row level security;

create policy "Users can read active challenges and those they started"
  on public.challenges for select to authenticated
  using (is_active or (select public.is_admin()) or public.enrolled_in_challenge(id));

create policy "Users can read their own enrollments, super admin all"
  on public.challenge_enrollments for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_super_admin()));

create policy "Users can read their own check-ins, super admin all"
  on public.challenge_checkins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_super_admin()));

revoke execute on function public.enrolled_in_challenge(uuid) from public, anon;
revoke execute on function public.start_challenge(uuid) from public, anon;
revoke execute on function public.challenge_check_in(uuid, date) from public, anon;
revoke execute on function public.admin_challenge_usage() from public, anon;
revoke execute on function public.admin_save_challenges(jsonb) from public, anon;
grant execute on function public.enrolled_in_challenge(uuid) to authenticated;
grant execute on function public.start_challenge(uuid) to authenticated;
grant execute on function public.challenge_check_in(uuid, date) to authenticated;
grant execute on function public.admin_challenge_usage() to authenticated;
grant execute on function public.admin_save_challenges(jsonb) to authenticated;
