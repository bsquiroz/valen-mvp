-- Lecciones secuenciales: una lección se desbloquea cuando el usuario completa la anterior del curso.
-- Completar es definitivo (no se desmarca): así el avance nunca vuelve a bloquear lo ya visto.

-- ¿Puede el usuario actual ver (y completar) esta lección?
-- Sí si es admin, si ya la completó, si es la primera del curso o si completó la anterior.
-- "Anterior" = la de posición inmediatamente menor entre las que el usuario ve (activas o ya completadas).
create function public.lesson_is_unlocked(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (
      select 1 from public.lesson_progress
      where lesson_id = p_lesson_id and user_id = (select auth.uid())
    )
    or coalesce((
      select exists (
        select 1 from public.lesson_progress p
        where p.lesson_id = prev.id and p.user_id = (select auth.uid())
      )
      from public.lessons l
      cross join lateral (
        select l2.id from public.lessons l2
        where l2.course_id = l.course_id
          and l2.position < l.position
          and (l2.is_active or exists (
            select 1 from public.lesson_progress p2
            where p2.lesson_id = l2.id and p2.user_id = (select auth.uid())
          ))
        order by l2.position desc
        limit 1
      ) prev
      where l.id = p_lesson_id
    ), true);
$$;

revoke execute on function public.lesson_is_unlocked(uuid) from public, anon;
grant execute on function public.lesson_is_unlocked(uuid) to authenticated;

drop policy "Users can complete active lessons" on public.lesson_progress;
create policy "Users can complete active unlocked lessons"
  on public.lesson_progress for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.lesson_is_active(lesson_id)
    and public.lesson_is_unlocked(lesson_id)
  );

-- Completar es definitivo
drop policy "Users can uncomplete their own lessons" on public.lesson_progress;
revoke delete on public.lesson_progress from authenticated;
