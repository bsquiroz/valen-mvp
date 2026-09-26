-- Vista previa del diagnóstico para admins: mismo cálculo que complete_diagnostic, sin guardar nada.

-- Valida las respuestas y calcula el puntaje 0–100 por pilar. Fuente única del cálculo.
create function public.compute_diagnostic_scores(p_answers jsonb)
returns table (pillar public.pillar, score smallint)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_expected integer;
  v_valid integer;
begin
  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'answers must be an array' using errcode = '22023';
  end if;

  select count(*) into v_expected
  from public.diagnostic_questions
  where is_active;

  select count(distinct a.question_id) into v_valid
  from jsonb_to_recordset(p_answers) as a (question_id uuid, option_id uuid)
  join public.diagnostic_questions q on q.id = a.question_id and q.is_active
  join public.diagnostic_options o on o.id = a.option_id and o.question_id = a.question_id;

  if v_valid <> v_expected or jsonb_array_length(p_answers) <> v_expected then
    raise exception 'answers are incomplete or invalid' using errcode = '22023';
  end if;

  return query
  select
    q.pillar,
    round(100.0 * sum(o.score) / greatest(sum(m.max_score), 1))::smallint
  from jsonb_to_recordset(p_answers) as a (question_id uuid, option_id uuid)
  join public.diagnostic_questions q on q.id = a.question_id
  join public.diagnostic_options o on o.id = a.option_id
  join (
    select question_id, max(score) as max_score
    from public.diagnostic_options
    group by question_id
  ) m on m.question_id = a.question_id
  group by q.pillar;
end;
$$;

-- Solo de uso interno (complete_diagnostic y preview_diagnostic)
revoke execute on function public.compute_diagnostic_scores(jsonb) from public, anon, authenticated;

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

  update public.profiles
  set last_diagnostic_at = now()
  where id = v_user_id;

  return v_attempt_id;
end;
$$;

create function public.preview_diagnostic(p_answers jsonb)
returns table (pillar public.pillar, score smallint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query select * from public.compute_diagnostic_scores(p_answers);
end;
$$;

revoke execute on function public.preview_diagnostic(jsonb) from public, anon;
grant execute on function public.preview_diagnostic(jsonb) to authenticated;
