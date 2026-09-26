-- Duración de las lecciones en segundos (el admin la escribe como min:seg, p. ej. 14:54).

alter table public.lessons rename column duration_minutes to duration_seconds;
alter table public.lessons drop constraint lessons_duration_minutes_check;
alter table public.lessons alter column duration_seconds type integer using duration_seconds * 60;
alter table public.lessons
  add constraint lessons_duration_seconds_check check (duration_seconds between 1 and 36000);

create or replace function public.admin_save_courses(p_courses jsonb)
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
          or not (coalesce(jsonb_typeof(l -> 'duration_seconds'), 'null') = 'null'
            or (jsonb_typeof(l -> 'duration_seconds') = 'number' and (l ->> 'duration_seconds') ~ '^[0-9]{1,5}$'
              and (l ->> 'duration_seconds')::integer between 1 and 36000))
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
        insert into public.lessons (course_id, position, title, description, video_id, duration_seconds, is_active)
        values (
          v_course_id,
          v_lesson.position,
          v_lesson.data -> 'title',
          nullif(v_lesson.data -> 'description', 'null'::jsonb),
          v_lesson.data ->> 'video_id',
          (v_lesson.data ->> 'duration_seconds')::integer,
          (v_lesson.data ->> 'is_active')::boolean
        );
      else
        update public.lessons
        set position = v_lesson.position,
          title = v_lesson.data -> 'title',
          description = nullif(v_lesson.data -> 'description', 'null'::jsonb),
          video_id = v_lesson.data ->> 'video_id',
          duration_seconds = (v_lesson.data ->> 'duration_seconds')::integer,
          is_active = (v_lesson.data ->> 'is_active')::boolean
        where id = (v_lesson.data ->> 'id')::uuid
          and (position, title, description, video_id, duration_seconds, is_active) is distinct from (
            v_lesson.position,
            v_lesson.data -> 'title',
            nullif(v_lesson.data -> 'description', 'null'::jsonb),
            v_lesson.data ->> 'video_id',
            (v_lesson.data ->> 'duration_seconds')::integer,
            (v_lesson.data ->> 'is_active')::boolean
          );
      end if;
    end loop;
  end loop;
end;
$$;
