-- Diagnóstico inicial: preguntas de opción múltiple por pilar, intentos y puntajes.

create type public.pillar as enum ('psychology', 'finance', 'fitness', 'relationships');

-- Texto traducible: {"es": "...", "en": "..."}
create function public.is_localized_text(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
    and jsonb_typeof(value -> 'es') = 'string' and length(value ->> 'es') > 0
    and jsonb_typeof(value -> 'en') = 'string' and length(value ->> 'en') > 0;
$$;

create table public.diagnostic_questions (
  id uuid primary key default gen_random_uuid(),
  pillar public.pillar not null,
  position smallint not null,
  prompt jsonb not null check (public.is_localized_text(prompt)),
  -- Las preguntas no se borran (el historial las referencia); se desactivan
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (pillar, position)
);

create table public.diagnostic_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.diagnostic_questions (id) on delete cascade,
  position smallint not null,
  label jsonb not null check (public.is_localized_text(label)),
  score smallint not null check (score between 0 and 3),
  unique (question_id, position)
);

create table public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_at timestamptz not null default now()
);

create index diagnostic_attempts_user_id_completed_at_idx
  on public.diagnostic_attempts (user_id, completed_at desc);

create table public.diagnostic_answers (
  attempt_id uuid not null references public.diagnostic_attempts (id) on delete cascade,
  question_id uuid not null references public.diagnostic_questions (id) on delete restrict,
  option_id uuid not null references public.diagnostic_options (id) on delete restrict,
  primary key (attempt_id, question_id)
);

-- Puntaje 0–100 por pilar de cada intento
create table public.diagnostic_scores (
  attempt_id uuid not null references public.diagnostic_attempts (id) on delete cascade,
  pillar public.pillar not null,
  score smallint not null check (score between 0 and 100),
  primary key (attempt_id, pillar)
);

-- Fecha del último diagnóstico completado; la escribe solo complete_diagnostic
alter table public.profiles add column last_diagnostic_at timestamptz;

-- Registra un intento completo y calcula los puntajes en la base (el cliente no puede enviarlos).
-- p_answers: [{"question_id": uuid, "option_id": uuid}, ...] con una respuesta por pregunta activa.
create function public.complete_diagnostic(p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_expected integer;
  v_valid integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

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

  insert into public.diagnostic_attempts (user_id)
  values (v_user_id)
  returning id into v_attempt_id;

  insert into public.diagnostic_answers (attempt_id, question_id, option_id)
  select v_attempt_id, a.question_id, a.option_id
  from jsonb_to_recordset(p_answers) as a (question_id uuid, option_id uuid);

  insert into public.diagnostic_scores (attempt_id, pillar, score)
  select
    v_attempt_id,
    q.pillar,
    round(100.0 * sum(o.score) / greatest(sum(m.max_score), 1))::smallint
  from public.diagnostic_answers da
  join public.diagnostic_questions q on q.id = da.question_id
  join public.diagnostic_options o on o.id = da.option_id
  join (
    select question_id, max(score) as max_score
    from public.diagnostic_options
    group by question_id
  ) m on m.question_id = da.question_id
  where da.attempt_id = v_attempt_id
  group by q.pillar;

  update public.profiles
  set last_diagnostic_at = now()
  where id = v_user_id;

  return v_attempt_id;
end;
$$;

-- Permisos: Supabase da acceso por defecto a anon/authenticated; se restringe explícitamente.
revoke all on public.diagnostic_questions, public.diagnostic_options,
  public.diagnostic_attempts, public.diagnostic_answers, public.diagnostic_scores
  from anon, authenticated;

grant select, insert, update, delete on public.diagnostic_questions, public.diagnostic_options to authenticated;
grant select on public.diagnostic_attempts, public.diagnostic_answers, public.diagnostic_scores to authenticated;

revoke execute on function public.complete_diagnostic(jsonb) from public, anon;
grant execute on function public.complete_diagnostic(jsonb) to authenticated;

-- RLS
alter table public.diagnostic_questions enable row level security;
alter table public.diagnostic_options enable row level security;
alter table public.diagnostic_attempts enable row level security;
alter table public.diagnostic_answers enable row level security;
alter table public.diagnostic_scores enable row level security;

create policy "Users can read active questions"
  on public.diagnostic_questions for select
  to authenticated
  using (is_active or (select public.is_admin()));

create policy "Admins can manage questions"
  on public.diagnostic_questions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users can read options"
  on public.diagnostic_options for select
  to authenticated
  using (true);

create policy "Admins can manage options"
  on public.diagnostic_options for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users can read their own attempts"
  on public.diagnostic_attempts for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Users can read their own answers"
  on public.diagnostic_answers for select
  to authenticated
  using (exists (
    select 1 from public.diagnostic_attempts a
    where a.id = attempt_id and (a.user_id = (select auth.uid()) or (select public.is_admin()))
  ));

create policy "Users can read their own scores"
  on public.diagnostic_scores for select
  to authenticated
  using (exists (
    select 1 from public.diagnostic_attempts a
    where a.id = attempt_id and (a.user_id = (select auth.uid()) or (select public.is_admin()))
  ));
