-- Corrige la validación de admin_reorder_diagnostic_questions: `id` sin calificar se resolvía
-- a q.id dentro de la subconsulta, así que ids ajenos al pilar no se detectaban.
create or replace function public.admin_reorder_diagnostic_questions(p_pillar public.pillar, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if cardinality(p_ids) is distinct from (select count(*) from public.diagnostic_questions where pillar = p_pillar)
    or cardinality(p_ids) <> (select count(distinct t.qid) from unnest(p_ids) as t (qid))
    or exists (
      select 1 from unnest(p_ids) as t (qid)
      where not exists (
        select 1 from public.diagnostic_questions q
        where q.id = t.qid and q.pillar = p_pillar
      )
    ) then
    raise exception 'ids must be exactly the questions of the pillar' using errcode = '22023';
  end if;

  update public.diagnostic_questions q
  set position = o.ordinality
  from unnest(p_ids) with ordinality as o (qid, ordinality)
  where q.id = o.qid;
end;
$$;
