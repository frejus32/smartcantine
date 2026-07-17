-- =============================================================================
-- SmartCantine — Migration 17 : alertes et quotas du dashboard
-- =============================================================================

set check_function_bodies = off;

-- Alertes actionnables : soldes négatifs (dettes), photos manquantes, soldes épuisés.
create or replace function public.alertes_dashboard()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with p as (select etablissement_id as eid from public.profils where id = auth.uid())
  select jsonb_build_object(
    'dettes', (select count(*) from public.eleves_detail ed, p
               where ed.etablissement_id = p.eid and ed.statut = 'actif' and ed.solde < 0),
    'soldes_epuises', (select count(*) from public.eleves_detail ed, p
               where ed.etablissement_id = p.eid and ed.statut = 'actif' and ed.solde = 0),
    'photos_manquantes', (select count(*) from public.eleves e, p
               where e.etablissement_id = p.eid and e.statut = 'actif' and e.photo_path is null),
    'quota_total_restant', (select coalesce(sum(greatest(ed.solde, 0)), 0)::int
               from public.eleves_detail ed, p
               where ed.etablissement_id = p.eid and ed.statut = 'actif')
  );
$$;

grant execute on function public.alertes_dashboard to authenticated;
