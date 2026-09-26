-- Guardar el avance del plan en una sola llamada: el usuario marca varios pasos y pulsa
-- "Guardar avance". Todo o nada; la fecha la pone la base.
-- security invoker: aplica la RLS de plan_steps (solo los pasos propios) y el grant de completed_at.
-- p_changes: [{"template_id": uuid, "completed": boolean}, ...]
create function public.save_plan_progress(p_changes jsonb)
returns table (template_id uuid, completed_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_expected integer;
  v_updated integer;
begin
  if jsonb_typeof(p_changes) is distinct from 'array' or jsonb_array_length(p_changes) = 0 then
    raise exception 'changes must be a non-empty array' using errcode = '22023';
  end if;

  select count(distinct c.template_id) into v_expected
  from jsonb_to_recordset(p_changes) as c (template_id uuid, completed boolean);

  if v_expected <> jsonb_array_length(p_changes)
    or exists (select 1 from jsonb_to_recordset(p_changes) as c (template_id uuid, completed boolean)
               where c.template_id is null or c.completed is null) then
    raise exception 'invalid changes' using errcode = '22023';
  end if;

  return query
  with updated as (
    update public.plan_steps s
    set completed_at = case when c.completed then coalesce(s.completed_at, now()) end
    from jsonb_to_recordset(p_changes) as c (template_id uuid, completed boolean)
    where s.template_id = c.template_id
      and s.user_id = (select auth.uid())
    returning s.template_id, s.completed_at
  )
  select u.template_id, u.completed_at from updated u;

  -- Si algún paso no es del usuario (o no existe), no se guarda nada
  get diagnostics v_updated = row_count;
  if v_updated <> v_expected then
    raise exception 'some plan steps were not found' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.save_plan_progress(jsonb) from public, anon;
grant execute on function public.save_plan_progress(jsonb) to authenticated;
