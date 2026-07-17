-- =============================================================================
-- SmartCantine — Migration 16 : RPC de rapports (quotidiens et mensuels)
-- Lecture seule, agrégations bornées par la RLS via le profil de l'appelant.
-- =============================================================================

set check_function_bodies = off;

-- Rapport quotidien complet : servis, à régulariser, absents, refus (double repas).
-- Les refus ne sont pas des passages ; on les compte via le journal d'audit des scans.
-- Pour le MVP, "tentatives de double repas" = passages refusés tracés côté scan
-- ne sont pas persistés → on expose ce que la base connaît de façon fiable.
create or replace function public.rapport_quotidien(p_jour date default current_date)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with p as (select etablissement_id as eid from public.profils where id = auth.uid())
  select jsonb_build_object(
    'jour', p_jour,
    'servis', (select count(*) from public.passages pa, p
               where pa.etablissement_id = p.eid and pa.date_service = p_jour and pa.statut = 'servi'),
    'a_regulariser', (select count(*) from public.passages pa, p
               where pa.etablissement_id = p.eid and pa.date_service = p_jour and pa.statut = 'a_regulariser'),
    'total_distribues', (select count(*) from public.passages pa, p
               where pa.etablissement_id = p.eid and pa.date_service = p_jour and pa.statut <> 'annule'),
    'annules', (select count(*) from public.passages pa, p
               where pa.etablissement_id = p.eid and pa.date_service = p_jour and pa.statut = 'annule'),
    'eleves_actifs', (select count(*) from public.eleves e, p
               where e.etablissement_id = p.eid and e.statut = 'actif'),
    'absents', (select count(*) from public.eleves e, p
               where e.etablissement_id = p.eid and e.statut = 'actif'
                 and not exists (select 1 from public.passages pa
                    where pa.eleve_id = e.id and pa.date_service = p_jour and pa.statut <> 'annule'))
  );
$$;

-- Détail par classe pour un jour (graphique du rapport quotidien).
create or replace function public.rapport_quotidien_par_classe(p_jour date default current_date)
returns table (classe text, servis integer)
language sql stable security definer set search_path = ''
as $$
  select c.nom, count(pa.id)::integer
  from public.classes c
  join public.profils p on p.id = auth.uid() and p.etablissement_id = c.etablissement_id
  left join public.eleves e on e.classe_id = c.id
  left join public.passages pa on pa.eleve_id = e.id
       and pa.date_service = p_jour and pa.statut <> 'annule'
  group by c.nom
  order by c.nom;
$$;

-- Rapport mensuel : consommation totale, moyenne/jour, quota théorique.
create or replace function public.rapport_mensuel(p_annee integer, p_mois integer)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with p as (select etablissement_id as eid from public.profils where id = auth.uid()),
  bornes as (select make_date(p_annee, p_mois, 1) as d1,
                    (make_date(p_annee, p_mois, 1) + interval '1 month - 1 day')::date as d2),
  passages_mois as (
    select pa.* from public.passages pa, p, bornes
    where pa.etablissement_id = p.eid and pa.date_service between bornes.d1 and bornes.d2
      and pa.statut <> 'annule'
  )
  select jsonb_build_object(
    'annee', p_annee, 'mois', p_mois,
    'total_repas', (select count(*) from passages_mois),
    'jours_service', (select count(distinct date_service) from passages_mois),
    'moyenne_par_jour', (select round(count(*)::numeric / nullif(count(distinct date_service), 0), 1)
                         from passages_mois),
    'a_regulariser', (select count(*) from passages_mois where statut = 'a_regulariser')
  );
$$;

-- Série mensuelle (repas par jour du mois) pour graphique.
create or replace function public.rapport_mensuel_serie(p_annee integer, p_mois integer)
returns table (jour date, servis integer)
language sql stable security definer set search_path = ''
as $$
  select pa.date_service, count(*)::integer
  from public.passages pa
  join public.profils p on p.id = auth.uid() and p.etablissement_id = pa.etablissement_id
  where pa.statut <> 'annule'
    and pa.date_service >= make_date(p_annee, p_mois, 1)
    and pa.date_service < make_date(p_annee, p_mois, 1) + interval '1 month'
  group by pa.date_service
  order by pa.date_service;
$$;

-- Calendrier : gérer l'année scolaire et les jours exceptionnels via RPC.
create or replace function public.annee_scolaire_active()
returns public.annees_scolaires
language sql stable security definer set search_path = ''
as $$
  select a.* from public.annees_scolaires a
  join public.profils p on p.id = auth.uid()
  where a.etablissement_id = p.etablissement_id and a.actif
  limit 1;
$$;

create or replace function public.lister_jours_exceptionnels()
returns setof public.jours_exceptionnels
language sql stable security definer set search_path = ''
as $$
  select j.* from public.jours_exceptionnels j
  join public.profils p on p.id = auth.uid()
  where j.etablissement_id = p.etablissement_id
  order by j.jour;
$$;

create or replace function public.ajouter_jour_exceptionnel(
  p_jour date, p_type public.type_jour_exceptionnel, p_motif text
)
returns public.jours_exceptionnels
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_annee public.annees_scolaires%rowtype; v_jour public.jours_exceptionnels%rowtype;
begin
  v_profil := private.exiger_role(array['admin','responsable']::public.role_utilisateur[]);
  select * into v_annee from public.annees_scolaires
   where etablissement_id = v_profil.etablissement_id and actif;
  if not found then
    raise exception 'Aucune année scolaire active.' using errcode = 'no_data_found';
  end if;
  insert into public.jours_exceptionnels (etablissement_id, annee_scolaire_id, jour, type, motif)
  values (v_profil.etablissement_id, v_annee.id, p_jour, p_type, trim(p_motif))
  returning * into v_jour;
  perform private.journaliser('jour_exceptionnel_ajoute', to_char(p_jour, 'YYYY-MM-DD'),
    jsonb_build_object('type', p_type, 'motif', trim(p_motif)));
  return v_jour;
exception when unique_violation then
  raise exception 'Ce jour est déjà marqué comme exceptionnel.' using errcode = 'unique_violation';
end;
$$;

create or replace function public.supprimer_jour_exceptionnel(p_id uuid)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype;
begin
  v_profil := private.exiger_role(array['admin','responsable']::public.role_utilisateur[]);
  delete from public.jours_exceptionnels
   where id = p_id and etablissement_id = v_profil.etablissement_id;
end;
$$;

grant execute on function
  public.rapport_quotidien, public.rapport_quotidien_par_classe,
  public.rapport_mensuel, public.rapport_mensuel_serie,
  public.annee_scolaire_active, public.lister_jours_exceptionnels,
  public.ajouter_jour_exceptionnel, public.supprimer_jour_exceptionnel
to authenticated;
