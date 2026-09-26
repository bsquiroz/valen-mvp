-- Corrige referencia ambigua: la columna de salida `score` chocaba con diagnostic_options.score.

create or replace function public.compute_diagnostic_scores(p_answers jsonb)
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
    select mo.question_id, max(mo.score) as max_score
    from public.diagnostic_options mo
    group by mo.question_id
  ) m on m.question_id = a.question_id
  group by q.pillar;
end;
$$;
