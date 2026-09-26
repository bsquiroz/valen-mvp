-- Cursos pregrabados: pilar → curso → lecciones. Los videos viven en Bunny Stream; aquí se
-- guarda el proveedor y el id del video. El enlace firmado lo genera la Edge Function lesson-video.
-- Regla: editar contenido nunca le quita progreso a un usuario. Una lección que alguien completó
-- no se borra (se desactiva) y el usuario la sigue viendo.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  pillar public.pillar not null,
  position smallint not null,
  title jsonb not null check (public.is_localized_text(title)),
  description jsonb check (description is null or public.is_localized_text(description)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint courses_pillar_position_key unique (pillar, position) deferrable initially deferred
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  -- Borrar un curso borra sus lecciones, salvo que alguna tenga progreso (lesson_progress lo impide)
  course_id uuid not null references public.courses (id) on delete cascade,
  position smallint not null,
  title jsonb not null check (public.is_localized_text(title)),
  description jsonb check (description is null or public.is_localized_text(description)),
  video_provider text not null default 'bunny' check (video_provider in ('bunny')),
  video_id text not null check (video_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  duration_minutes smallint check (duration_minutes between 1 and 600),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint lessons_course_id_position_key unique (course_id, position) deferrable initially deferred
);

create index lessons_course_id_idx on public.lessons (course_id);

create table public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete restrict,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

-- Permisos: lectura para todos; escritura de contenido solo por admin_save_courses.
-- El usuario marca (insert) o desmarca (delete) sus lecciones; user_id y fecha los pone la base.
revoke all on public.courses, public.lessons, public.lesson_progress from anon, authenticated;
grant select on public.courses, public.lessons to authenticated;
grant select, delete on public.lesson_progress to authenticated;
grant insert (lesson_id) on public.lesson_progress to authenticated;

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

-- Auxiliares para las políticas: security definer evita la recursión entre las RLS de
-- lessons y lesson_progress (cada una consulta a la otra).
create function public.completed_lesson(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lesson_progress
    where lesson_id = p_lesson_id and user_id = (select auth.uid())
  );
$$;

create function public.started_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lessons l
    join public.lesson_progress p on p.lesson_id = l.id
    where l.course_id = p_course_id and p.user_id = (select auth.uid())
  );
$$;

create function public.lesson_is_active(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.lessons where id = p_lesson_id and is_active);
$$;

revoke execute on function public.completed_lesson(uuid) from public, anon;
revoke execute on function public.started_course(uuid) from public, anon;
revoke execute on function public.lesson_is_active(uuid) from public, anon;
grant execute on function public.completed_lesson(uuid) to authenticated;
grant execute on function public.started_course(uuid) to authenticated;
grant execute on function public.lesson_is_active(uuid) to authenticated;

create policy "Users can read active courses and those they started"
  on public.courses for select to authenticated
  using (is_active or (select public.is_admin()) or public.started_course(id));

create policy "Users can read active lessons and those they completed"
  on public.lessons for select to authenticated
  using (is_active or (select public.is_admin()) or public.completed_lesson(id));

create policy "Users can read their own progress, super admin all"
  on public.lesson_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_super_admin()));

create policy "Users can complete active lessons"
  on public.lesson_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and public.lesson_is_active(lesson_id));

create policy "Users can uncomplete their own lessons"
  on public.lesson_progress for delete to authenticated
  using (user_id = (select auth.uid()));

-- Cuántos usuarios completaron cada lección (dato agregado para el admin)
create function public.admin_lesson_usage()
returns table (lesson_id uuid, users integer)
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
  select p.lesson_id, count(*)::integer
  from public.lesson_progress p
  group by p.lesson_id;
end;
$$;

-- Guarda el borrador del editor de cursos en una sola llamada (todo o nada; solo escribe lo que cambió).
-- p_courses: todos los cursos, en orden dentro de cada pilar:
-- [{"id": uuid|null, "pillar": pillar, "title": {"es","en"}, "description": {"es","en"}|null,
--   "is_active": boolean,
--   "lessons": [{"id": uuid|null, "title", "description", "video_id": uuid,
--                "duration_minutes": int|null, "is_active": boolean}, ...]}, ...]
-- Lo que no viene se borra, salvo lecciones con progreso (falla todo: hay que desactivarlas).
create function public.admin_save_courses(p_courses jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course record;
  v_lesson record;
  v_course_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if jsonb_typeof(p_courses) is distinct from 'array' then
    raise exception 'courses must be an array' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_courses) c
    where jsonb_typeof(c) is distinct from 'object'
      or not coalesce(c ->> 'pillar' = any (enum_range(null::public.pillar)::text[]), false)
      or not public.is_localized_text(c -> 'title')
      or not (coalesce(jsonb_typeof(c -> 'description'), 'null') = 'null' or public.is_localized_text(c -> 'description'))
      or jsonb_typeof(c -> 'is_active') is distinct from 'boolean'
      or jsonb_typeof(c -> 'lessons') is distinct from 'array'
      or exists (
        select 1 from jsonb_array_elements(c -> 'lessons') l
        where jsonb_typeof(l) is distinct from 'object'
          or not public.is_localized_text(l -> 'title')
          or not (coalesce(jsonb_typeof(l -> 'description'), 'null') = 'null' or public.is_localized_text(l -> 'description'))
          or not coalesce(l ->> 'video_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', false)
          or not (coalesce(jsonb_typeof(l -> 'duration_minutes'), 'null') = 'null'
            or (jsonb_typeof(l -> 'duration_minutes') = 'number' and (l ->> 'duration_minutes') ~ '^[0-9]{1,3}$'
              and (l ->> 'duration_minutes')::integer between 1 and 600))
          or jsonb_typeof(l -> 'is_active') is distinct from 'boolean'
      )
  ) then
    raise exception 'invalid courses' using errcode = '22023';
  end if;

  -- Ids existentes: únicos, conservan su pilar (cursos) y su curso (lecciones)
  if exists (
    select 1 from jsonb_array_elements(p_courses) c
    where c ->> 'id' is not null
      and not exists (
        select 1 from public.courses co
        where co.id = (c ->> 'id')::uuid and co.pillar::text = c ->> 'pillar'
      )
  )
  or (select count(c ->> 'id') <> count(distinct c ->> 'id') from jsonb_array_elements(p_courses) c)
  or exists (
    select 1 from jsonb_array_elements(p_courses) c, jsonb_array_elements(c -> 'lessons') l
    where l ->> 'id' is not null
      and not exists (
        select 1 from public.lessons le
        where le.id = (l ->> 'id')::uuid and le.course_id = (c ->> 'id')::uuid
      )
  )
  or (
    select count(l ->> 'id') <> count(distinct l ->> 'id')
    from jsonb_array_elements(p_courses) c, jsonb_array_elements(c -> 'lessons') l
  ) then
    raise exception 'unknown or duplicate ids' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('admin_save_courses'));

  -- Lecciones que no vienen (sueltas o dentro de cursos borrados): no se borran si tienen progreso
  if exists (
    select 1 from public.lessons le
    join public.lesson_progress p on p.lesson_id = le.id
    where not exists (
      select 1 from jsonb_array_elements(p_courses) c, jsonb_array_elements(c -> 'lessons') l
      where (l ->> 'id')::uuid = le.id
    )
  ) then
    raise exception 'lesson is in use' using errcode = '23503', hint = 'lesson_in_use';
  end if;

  delete from public.courses co
  where not exists (select 1 from jsonb_array_elements(p_courses) c where (c ->> 'id')::uuid = co.id);

  for v_course in
    select c.value as data,
      row_number() over (partition by c.value ->> 'pillar' order by c.ordinality)::smallint as position
    from jsonb_array_elements(p_courses) with ordinality as c
  loop
    v_course_id := (v_course.data ->> 'id')::uuid;

    if v_course_id is null then
      insert into public.courses (pillar, position, title, description, is_active)
      values (
        (v_course.data ->> 'pillar')::public.pillar,
        v_course.position,
        v_course.data -> 'title',
        nullif(v_course.data -> 'description', 'null'::jsonb),
        (v_course.data ->> 'is_active')::boolean
      )
      returning id into v_course_id;
    else
      update public.courses
      set position = v_course.position,
        title = v_course.data -> 'title',
        description = nullif(v_course.data -> 'description', 'null'::jsonb),
        is_active = (v_course.data ->> 'is_active')::boolean
      where id = v_course_id
        and (position, title, description, is_active) is distinct from (
          v_course.position,
          v_course.data -> 'title',
          nullif(v_course.data -> 'description', 'null'::jsonb),
          (v_course.data ->> 'is_active')::boolean
        );

      delete from public.lessons le
      where le.course_id = v_course_id
        and not exists (
          select 1 from jsonb_array_elements(v_course.data -> 'lessons') l
          where (l ->> 'id')::uuid = le.id
        );
    end if;

    for v_lesson in
      select l.value as data, l.ordinality::smallint as position
      from jsonb_array_elements(v_course.data -> 'lessons') with ordinality as l
    loop
      if v_lesson.data ->> 'id' is null then
        insert into public.lessons (course_id, position, title, description, video_id, duration_minutes, is_active)
        values (
          v_course_id,
          v_lesson.position,
          v_lesson.data -> 'title',
          nullif(v_lesson.data -> 'description', 'null'::jsonb),
          v_lesson.data ->> 'video_id',
          (v_lesson.data ->> 'duration_minutes')::smallint,
          (v_lesson.data ->> 'is_active')::boolean
        );
      else
        update public.lessons
        set position = v_lesson.position,
          title = v_lesson.data -> 'title',
          description = nullif(v_lesson.data -> 'description', 'null'::jsonb),
          video_id = v_lesson.data ->> 'video_id',
          duration_minutes = (v_lesson.data ->> 'duration_minutes')::smallint,
          is_active = (v_lesson.data ->> 'is_active')::boolean
        where id = (v_lesson.data ->> 'id')::uuid
          and (position, title, description, video_id, duration_minutes, is_active) is distinct from (
            v_lesson.position,
            v_lesson.data -> 'title',
            nullif(v_lesson.data -> 'description', 'null'::jsonb),
            v_lesson.data ->> 'video_id',
            (v_lesson.data ->> 'duration_minutes')::smallint,
            (v_lesson.data ->> 'is_active')::boolean
          );
      end if;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.admin_lesson_usage() from public, anon;
revoke execute on function public.admin_save_courses(jsonb) from public, anon;
grant execute on function public.admin_lesson_usage() to authenticated;
grant execute on function public.admin_save_courses(jsonb) to authenticated;
