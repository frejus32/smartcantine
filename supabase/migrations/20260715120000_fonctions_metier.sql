-- =============================================================================
-- SmartCantine — Migration 8 : fonctions métier (SECURITY DEFINER)
-- Toute écriture de repas passe ici. Aucune politique RLS d'insertion n'existe
-- sur mouvements_repas ni passages : ces fonctions sont LE seul chemin.
-- =============================================================================

set check_function_bodies = off;

-- Contexte de l'appelant, avec vérification du rôle exigé.
create or replace function private.exiger_role(p_roles public.role_utilisateur[])
returns public.profils
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profil public.profils%rowtype;
begin
  select * into v_profil from public.profils where id = auth.uid();
  if not found then
    raise exception 'Profil introuvable pour cet utilisateur.' using errcode = 'insufficient_privilege';
  end if;
  if not (v_profil.role = any (p_roles)) then
    raise exception 'Rôle % non autorisé pour cette opération.', v_profil.role
      using errcode = 'insufficient_privilege';
  end if;
  return v_profil;
end;
$$;

-- Élève de MON école, sinon exception (aucune fuite d'information inter-tenant).
create or replace function private.exiger_eleve(p_eleve_id uuid, p_etablissement_id uuid)
returns public.eleves
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_eleve public.eleves%rowtype;
begin
  select * into v_eleve from public.eleves
   where id = p_eleve_id and etablissement_id = p_etablissement_id;
  if not found then
    raise exception 'Élève introuvable dans votre établissement.' using errcode = 'no_data_found';
  end if;
  return v_eleve;
end;
$$;

-- ---------------------------------------------------------------------------
-- Créditer « le mois » : quota calculé depuis le calendrier, prorata automatique
-- si le mois est en cours (US-02, US-04, CA-5). Un seul crédit par mois et par élève.
-- ---------------------------------------------------------------------------
create or replace function public.crediter_mois(
  p_eleve_id uuid,
  p_annee integer,
  p_mois integer,
  p_a_partir_de date default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_profil    public.profils%rowtype;
  v_eleve     public.eleves%rowtype;
  v_annee     public.annees_scolaires%rowtype;
  v_debut     date := make_date(p_annee, p_mois, 1);
  v_fin       date := (make_date(p_annee, p_mois, 1) + interval '1 month - 1 day')::date;
  v_a_partir  date;
  v_quota     integer;
begin
  v_profil := private.exiger_role(array['admin', 'responsable']::public.role_utilisateur[]);
  v_eleve  := private.exiger_eleve(p_eleve_id, v_profil.etablissement_id);

  if v_eleve.statut <> 'actif' then
    raise exception 'Cet élève est désactivé : crédit impossible.' using errcode = 'check_violation';
  end if;
  if v_fin < current_date then
    raise exception 'Le mois %/% est déjà terminé : crédit impossible.', p_mois, p_annee
      using errcode = 'check_violation';
  end if;

  select * into v_annee from public.annees_scolaires
   where etablissement_id = v_profil.etablissement_id and actif
     and date_debut <= v_fin and date_fin >= v_debut;
  if not found then
    raise exception 'Aucune année scolaire active ne couvre %/%.', p_mois, p_annee
      using errcode = 'no_data_found';
  end if;

  -- Prorata : jamais avant le 1er du mois, jamais avant aujourd'hui,
  -- jamais avant la date explicite demandée (inscription en cours de mois).
  v_a_partir := greatest(v_debut, current_date, coalesce(p_a_partir_de, v_debut));
  v_quota := private.compter_jours_ouverts(v_annee.id, v_a_partir, v_fin);

  if v_quota = 0 then
    raise exception 'Aucun jour de cantine restant sur %/% : rien à créditer.', p_mois, p_annee
      using errcode = 'check_violation';
  end if;

  begin
    insert into public.mouvements_repas
      (etablissement_id, eleve_id, type, quantite, periode, motif, auteur_id)
    values
      (v_profil.etablissement_id, p_eleve_id, 'credit_mois', v_quota, v_debut,
       'Mois ' || to_char(v_debut, 'MM/YYYY') || ' — ' || v_quota || ' jours de cantine'
         || case when v_a_partir > v_debut then ' (prorata du ' || to_char(v_a_partir, 'DD/MM') || ')' else '' end,
       v_profil.id);
  exception when unique_violation then
    raise exception 'Le mois %/% a déjà été crédité pour cet élève.', p_mois, p_annee
      using errcode = 'unique_violation';
  end;

  return jsonb_build_object(
    'quota', v_quota,
    'periode', to_char(v_debut, 'YYYY-MM'),
    'prorata', v_a_partir > v_debut,
    'solde', public.solde_eleve(p_eleve_id)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Créditer un carnet : N repas payés au ticket (US-03).
-- ---------------------------------------------------------------------------
create or replace function public.crediter_carnet(p_eleve_id uuid, p_quantite integer)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_profil public.profils%rowtype;
  v_eleve  public.eleves%rowtype;
begin
  v_profil := private.exiger_role(array['admin', 'responsable']::public.role_utilisateur[]);
  v_eleve  := private.exiger_eleve(p_eleve_id, v_profil.etablissement_id);

  if v_eleve.statut <> 'actif' then
    raise exception 'Cet élève est désactivé : crédit impossible.' using errcode = 'check_violation';
  end if;
  if p_quantite is null or p_quantite < 1 or p_quantite > 200 then
    raise exception 'Quantité invalide : entre 1 et 200 repas.' using errcode = 'check_violation';
  end if;

  insert into public.mouvements_repas
    (etablissement_id, eleve_id, type, quantite, motif, auteur_id)
  values
    (v_profil.etablissement_id, p_eleve_id, 'credit_carnet', p_quantite,
     'Carnet de ' || p_quantite || ' repas', v_profil.id);

  return jsonb_build_object('solde', public.solde_eleve(p_eleve_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- Ajustement (contre-écriture) : correction motivée, admin uniquement (EF-C5/EF-D4).
-- ---------------------------------------------------------------------------
create or replace function public.ajuster_solde(p_eleve_id uuid, p_quantite integer, p_motif text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_profil public.profils%rowtype;
begin
  v_profil := private.exiger_role(array['admin']::public.role_utilisateur[]);
  perform private.exiger_eleve(p_eleve_id, v_profil.etablissement_id);

  if p_quantite is null or p_quantite = 0 or abs(p_quantite) > 200 then
    raise exception 'Quantité d''ajustement invalide.' using errcode = 'check_violation';
  end if;
  if p_motif is null or char_length(trim(p_motif)) < 3 then
    raise exception 'Un motif d''au moins 3 caractères est obligatoire pour un ajustement.'
      using errcode = 'check_violation';
  end if;

  insert into public.mouvements_repas
    (etablissement_id, eleve_id, type, quantite, motif, auteur_id)
  values
    (v_profil.etablissement_id, p_eleve_id, 'ajustement', p_quantite, trim(p_motif), v_profil.id);

  return jsonb_build_object('solde', public.solde_eleve(p_eleve_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- LE CŒUR : enregistrer un passage à la cantine (EF-E1 à EF-E6).
-- Retourne toujours un verdict jsonb — jamais d'exception pour les cas métier,
-- car l'écran de scan doit afficher rouge/orange, pas une erreur technique.
-- Détail concurrence : si deux postes scannent le même élève au même instant,
-- l'index unique tranche ; le perdant reçoit unique_violation, intercepté
-- et transformé en verdict rouge « déjà servi ». La règle d'or tient toujours.
-- ---------------------------------------------------------------------------
create or replace function public.enregistrer_passage(p_eleve_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_profil    public.profils%rowtype;
  v_eleve     public.eleves%rowtype;
  v_politique public.politique_solde;
  v_solde     integer;
  v_statut    public.statut_passage;
  v_passage   uuid;
  v_premier   timestamptz;
begin
  v_profil := private.exiger_role(array['admin', 'responsable', 'agent']::public.role_utilisateur[]);

  select * into v_eleve from public.eleves
   where id = p_eleve_id and etablissement_id = v_profil.etablissement_id;
  if not found then
    return jsonb_build_object('verdict', 'rouge', 'code', 'eleve_inconnu');
  end if;
  if v_eleve.statut <> 'actif' then
    return jsonb_build_object('verdict', 'rouge', 'code', 'eleve_desactive',
      'eleve', v_eleve.prenoms || ' ' || v_eleve.nom);
  end if;

  -- Déjà servi aujourd'hui ? (vérification rapide avant tentative)
  select horodatage into v_premier from public.passages
   where eleve_id = p_eleve_id and date_service = current_date
     and type_service = 'dejeuner' and statut <> 'annule';
  if found then
    return jsonb_build_object('verdict', 'rouge', 'code', 'deja_servi',
      'eleve', v_eleve.prenoms || ' ' || v_eleve.nom,
      'heure_premier_passage', to_char(v_premier at time zone 'utc', 'HH24:MI'));
  end if;

  v_solde := public.solde_eleve(p_eleve_id);

  if v_solde >= 1 then
    v_statut := 'servi';
  else
    select politique_solde_epuise into v_politique
      from public.etablissements where id = v_profil.etablissement_id;
    if v_politique = 'strict' then
      return jsonb_build_object('verdict', 'orange', 'code', 'solde_epuise_bloque',
        'eleve', v_eleve.prenoms || ' ' || v_eleve.nom, 'solde', v_solde);
    end if;
    v_statut := 'a_regulariser';
  end if;

  begin
    insert into public.passages (etablissement_id, eleve_id, statut, auteur_id)
    values (v_profil.etablissement_id, p_eleve_id, v_statut, v_profil.id)
    returning id into v_passage;
  exception when unique_violation then
    -- Course perdue contre un autre poste : la contrainte d'or a tranché.
    select horodatage into v_premier from public.passages
     where eleve_id = p_eleve_id and date_service = current_date
       and type_service = 'dejeuner' and statut <> 'annule';
    return jsonb_build_object('verdict', 'rouge', 'code', 'deja_servi',
      'eleve', v_eleve.prenoms || ' ' || v_eleve.nom,
      'heure_premier_passage', to_char(coalesce(v_premier, now()) at time zone 'utc', 'HH24:MI'));
  end;

  insert into public.mouvements_repas
    (etablissement_id, eleve_id, type, quantite, passage_id, auteur_id)
  values
    (v_profil.etablissement_id, p_eleve_id, 'consommation', -1, v_passage, v_profil.id);

  return jsonb_build_object(
    'verdict', case when v_statut = 'servi' then 'vert' else 'orange' end,
    'code',    case when v_statut = 'servi' then 'servi' else 'a_regulariser' end,
    'eleve',   v_eleve.prenoms || ' ' || v_eleve.nom,
    'classe_id', v_eleve.classe_id,
    'passage_id', v_passage,
    'solde', v_solde - 1
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Annulation d'un passage sous 5 minutes (EF-E9) : transition contrôlée
-- + contre-écriture qui restitue le repas. Le trigger garde la fenêtre de temps.
-- ---------------------------------------------------------------------------
create or replace function public.annuler_passage(p_passage_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_profil  public.profils%rowtype;
  v_passage public.passages%rowtype;
begin
  v_profil := private.exiger_role(array['admin', 'responsable']::public.role_utilisateur[]);

  select * into v_passage from public.passages
   where id = p_passage_id and etablissement_id = v_profil.etablissement_id;
  if not found then
    raise exception 'Passage introuvable dans votre établissement.' using errcode = 'no_data_found';
  end if;
  if v_passage.statut = 'annule' then
    raise exception 'Ce passage est déjà annulé.' using errcode = 'check_violation';
  end if;

  update public.passages
     set statut = 'annule', annule_a = now(), annule_par = v_profil.id
   where id = p_passage_id;

  insert into public.mouvements_repas
    (etablissement_id, eleve_id, type, quantite, passage_id, motif, auteur_id)
  values
    (v_profil.etablissement_id, v_passage.eleve_id, 'ajustement', 1, p_passage_id,
     'Annulation du passage de ' || to_char(v_passage.horodatage, 'HH24:MI'), v_profil.id);

  return jsonb_build_object('solde', public.solde_eleve(v_passage.eleve_id));
end;
$$;

grant execute on function
  public.est_jour_ouvert, public.quota_du_mois, public.solde_eleve,
  public.crediter_mois, public.crediter_carnet, public.ajuster_solde,
  public.enregistrer_passage, public.annuler_passage
to authenticated;
