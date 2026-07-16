-- =============================================================================
-- SmartCantine — Migration 11 : vues et RPC de lecture pour l'interface
-- Lecture seule, agrégations ; le grand livre et les fonctions métier restent
-- l'unique source de vérité. Toutes ces vues respectent la RLS sous-jacente.
-- =============================================================================

set check_function_bodies = off;

-- Élèves enrichis : classe + solde courant, borné à l'école de l'appelant par la RLS.
create or replace view public.eleves_detail
with (security_invoker = true) as
  select
    e.id, e.etablissement_id, e.classe_id, e.matricule, e.nom, e.prenoms,
    e.date_naissance, e.photo_path, e.consentement_photo, e.statut,
    e.created_at,
    c.nom as classe_nom, c.niveau as classe_niveau,
    coalesce((select sum(m.quantite) from public.mouvements_repas m
              where m.eleve_id = e.id), 0)::integer as solde
  from public.eleves e
  join public.classes c on c.id = e.classe_id;

-- Classes avec effectif d'élèves actifs.
create or replace view public.classes_detail
with (security_invoker = true) as
  select c.*,
    (select count(*) from public.eleves e
      where e.classe_id = c.id and e.statut = 'actif')::integer as effectif
  from public.classes c;

-- KPI du jour pour le dashboard, calculés côté base (une seule requête).
create or replace function public.stats_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with p as (select etablissement_id as eid from public.profils where id = auth.uid())
  select jsonb_build_object(
    'eleves_actifs', (select count(*) from public.eleves e, p
                      where e.etablissement_id = p.eid and e.statut = 'actif'),
    'classes', (select count(*) from public.classes c, p where c.etablissement_id = p.eid),
    'repas_servis_aujourdhui', (select count(*) from public.passages pa, p
        where pa.etablissement_id = p.eid and pa.date_service = current_date
          and pa.statut <> 'annule'),
    'a_regulariser_aujourdhui', (select count(*) from public.passages pa, p
        where pa.etablissement_id = p.eid and pa.date_service = current_date
          and pa.statut = 'a_regulariser'),
    'refus_aujourdhui', 0
  );
$$;

-- Série des repas servis par jour de service (14 derniers jours ouvrés au plus).
create or replace function public.serie_repas(p_jours integer default 14)
returns table (jour date, servis integer)
language sql
stable
security definer
set search_path = ''
as $$
  select pa.date_service as jour, count(*)::integer as servis
  from public.passages pa
  join public.profils p on p.id = auth.uid()
  where pa.etablissement_id = p.etablissement_id
    and pa.statut <> 'annule'
    and pa.date_service > current_date - (p_jours * 2)
  group by pa.date_service
  order by pa.date_service
  limit p_jours;
$$;

-- Activité récente : derniers passages avec nom d'élève (dashboard).
create or replace function public.activite_recente(p_limite integer default 8)
returns table (
  passage_id uuid, heure timestamptz, eleve text, statut public.statut_passage
)
language sql
stable
security definer
set search_path = ''
as $$
  select pa.id, pa.horodatage, e.prenoms || ' ' || e.nom, pa.statut
  from public.passages pa
  join public.eleves e on e.id = pa.eleve_id
  join public.profils p on p.id = auth.uid()
  where pa.etablissement_id = p.etablissement_id
    and pa.date_service = current_date
  order by pa.horodatage desc
  limit p_limite;
$$;

grant select on public.eleves_detail, public.classes_detail to authenticated;
grant execute on function public.stats_dashboard, public.serie_repas, public.activite_recente
  to authenticated;
