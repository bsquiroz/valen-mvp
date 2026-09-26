-- Una sola política permisiva por tabla/acción (recomendación del advisor de Supabase: rendimiento).

-- profiles: lectura propia o admin en una sola política
drop policy "Users can read their own profile" on public.profiles;
drop policy "Admins can read all profiles" on public.profiles;

create policy "Users can read their own profile, admins all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- diagnostic_questions / diagnostic_options: el "for all" de admin se separa por acción
drop policy "Admins can manage questions" on public.diagnostic_questions;
drop policy "Admins can manage options" on public.diagnostic_options;

create policy "Admins can insert questions"
  on public.diagnostic_questions for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update questions"
  on public.diagnostic_questions for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete questions"
  on public.diagnostic_questions for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins can insert options"
  on public.diagnostic_options for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update options"
  on public.diagnostic_options for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete options"
  on public.diagnostic_options for delete to authenticated
  using ((select public.is_admin()));
