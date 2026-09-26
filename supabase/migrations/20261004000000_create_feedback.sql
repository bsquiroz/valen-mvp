-- Sugerencias y bugs: cualquier usuario con sesión envía feedback desde el botón flotante.
-- Solo el super admin lo lee y cambia su estado (son datos de usuarios).

create type public.feedback_type as enum ('suggestion', 'bug', 'complaint', 'improvement');
create type public.feedback_status as enum ('new', 'in_review', 'resolved', 'dismissed');

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.feedback_type not null,
  message text not null check (char_length(message) between 10 and 2000),
  -- Página desde la que se envió y navegador: contexto para entender (sobre todo los bugs)
  page text check (char_length(page) <= 500),
  user_agent text check (char_length(user_agent) <= 500),
  status public.feedback_status not null default 'new',
  created_at timestamptz not null default now()
);

create index feedback_status_created_at_idx on public.feedback (status, created_at desc);
create index feedback_user_id_created_at_idx on public.feedback (user_id, created_at desc);

-- Sin acceso directo: todo por las RPC de abajo
revoke all on public.feedback from anon, authenticated;
alter table public.feedback enable row level security;

-- Envía un feedback (máximo 10 por usuario por hora).
create function public.submit_feedback(
  p_type public.feedback_type,
  p_message text,
  p_page text,
  p_user_agent text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_type is null or char_length(trim(coalesce(p_message, ''))) not between 10 and 2000 then
    raise exception 'invalid feedback' using errcode = '22023';
  end if;

  if (select count(*) from public.feedback
      where user_id = v_user_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too many feedback messages' using errcode = 'P0001', hint = 'feedback_rate_limited';
  end if;

  insert into public.feedback (user_id, type, message, page, user_agent)
  values (v_user_id, p_type, trim(p_message), left(p_page, 500), left(p_user_agent, 500))
  returning id into v_id;

  return v_id;
end;
$$;

-- Bandeja del super admin, con quién lo envió
create function public.super_admin_list_feedback()
returns table (
  id uuid,
  type public.feedback_type,
  message text,
  page text,
  user_agent text,
  status public.feedback_status,
  created_at timestamptz,
  user_id uuid,
  display_name text,
  email text
)
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
  select f.id, f.type, f.message, f.page, f.user_agent, f.status, f.created_at,
    f.user_id, p.display_name, u.email::text
  from public.feedback f
  left join public.profiles p on p.id = f.user_id
  left join auth.users u on u.id = f.user_id
  order by f.created_at desc;
end;
$$;

create function public.super_admin_set_feedback_status(p_id uuid, p_status public.feedback_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.feedback set status = p_status where id = p_id;
  if not found then
    raise exception 'feedback not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.submit_feedback(public.feedback_type, text, text, text) from public, anon;
revoke execute on function public.super_admin_list_feedback() from public, anon;
revoke execute on function public.super_admin_set_feedback_status(uuid, public.feedback_status) from public, anon;
grant execute on function public.submit_feedback(public.feedback_type, text, text, text) to authenticated;
grant execute on function public.super_admin_list_feedback() to authenticated;
grant execute on function public.super_admin_set_feedback_status(uuid, public.feedback_status) to authenticated;
