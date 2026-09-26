-- complete_diagnostic creaba una tabla temporal `scores`: una segunda llamada en la misma
-- transacción fallaba con "relation already exists". Se valida y calcula sin tabla temporal.
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
  set last_diagnostic_at = now()
  where id = v_user_id;

  return v_attempt_id;
end;
$$;
