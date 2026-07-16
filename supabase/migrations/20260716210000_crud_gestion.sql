-- =============================================================================
-- SmartCantine — Migration 12 : fonctions de gestion (élèves, classes)
-- Écriture encadrée : rôle vérifié, établissement forcé au tenant de l'appelant.
-- Le consentement photo est daté automatiquement (EF-A4).
-- =============================================================================

set check_function_bodies = off;

create or replace function public.creer_classe(p_nom text, p_niveau public.niveau_scolaire)
returns public.classes
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_classe public.classes%rowtype;
begin
  v_profil := private.exiger_role(array['admin','responsable']::public.role_utilisateur[]);
  insert into public.classes (etablissement_id, nom, niveau)
  values (v_profil.etablissement_id, trim(p_nom), p_niveau)
  returning * into v_classe;
  return v_classe;
exception when unique_violation then
  raise exception 'Une classe nommée « % » existe déjà.', p_nom using errcode = 'unique_violation';
end;
$$;

create or replace function public.creer_eleve(
  p_classe_id uuid, p_matricule text, p_nom text, p_prenoms text,
  p_date_naissance date default null, p_consentement_photo boolean default false
)
returns public.eleves
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_eleve public.eleves%rowtype;
begin
  v_profil := private.exiger_role(array['admin','responsable']::public.role_utilisateur[]);

  perform 1 from public.classes
   where id = p_classe_id and etablissement_id = v_profil.etablissement_id;
  if not found then
    raise exception 'Classe introuvable dans votre établissement.' using errcode = 'no_data_found';
  end if;

  insert into public.eleves
    (etablissement_id, classe_id, matricule, nom, prenoms, date_naissance,
     consentement_photo, consentement_date)
  values
    (v_profil.etablissement_id, p_classe_id, trim(p_matricule), trim(p_nom), trim(p_prenoms),
     p_date_naissance, coalesce(p_consentement_photo, false),
     case when p_consentement_photo then now() else null end)
  returning * into v_eleve;
  return v_eleve;
exception when unique_violation then
  raise exception 'Le matricule « % » est déjà utilisé.', p_matricule using errcode = 'unique_violation';
end;
$$;

create or replace function public.modifier_eleve(
  p_eleve_id uuid, p_classe_id uuid, p_matricule text, p_nom text, p_prenoms text,
  p_date_naissance date default null, p_consentement_photo boolean default null
)
returns public.eleves
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_ancien public.eleves%rowtype; v_eleve public.eleves%rowtype;
begin
  v_profil := private.exiger_role(array['admin','responsable']::public.role_utilisateur[]);
  v_ancien := private.exiger_eleve(p_eleve_id, v_profil.etablissement_id);

  perform 1 from public.classes
   where id = p_classe_id and etablissement_id = v_profil.etablissement_id;
  if not found then
    raise exception 'Classe introuvable dans votre établissement.' using errcode = 'no_data_found';
  end if;

  update public.eleves set
    classe_id = p_classe_id, matricule = trim(p_matricule),
    nom = trim(p_nom), prenoms = trim(p_prenoms), date_naissance = p_date_naissance,
    consentement_photo = coalesce(p_consentement_photo, consentement_photo),
    consentement_date = case
      when p_consentement_photo is true and not v_ancien.consentement_photo then now()
      when p_consentement_photo is false then null
      else consentement_date end
  where id = p_eleve_id
  returning * into v_eleve;
  return v_eleve;
exception when unique_violation then
  raise exception 'Le matricule « % » est déjà utilisé.', p_matricule using errcode = 'unique_violation';
end;
$$;

-- Désactivation / réactivation (jamais de suppression — historique préservé).
create or replace function public.definir_statut_eleve(p_eleve_id uuid, p_statut public.statut_eleve)
returns public.eleves
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_eleve public.eleves%rowtype;
begin
  v_profil := private.exiger_role(array['admin','responsable']::public.role_utilisateur[]);
  perform private.exiger_eleve(p_eleve_id, v_profil.etablissement_id);
  update public.eleves set statut = p_statut where id = p_eleve_id returning * into v_eleve;
  return v_eleve;
end;
$$;

-- Enregistre le chemin de photo (après upload Storage) + date le consentement.
create or replace function public.definir_photo_eleve(p_eleve_id uuid, p_photo_path text)
returns public.eleves
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_eleve public.eleves%rowtype;
begin
  v_profil := private.exiger_role(array['admin','responsable']::public.role_utilisateur[]);
  perform private.exiger_eleve(p_eleve_id, v_profil.etablissement_id);
  update public.eleves set
    photo_path = p_photo_path,
    consentement_photo = true,
    consentement_date = coalesce(consentement_date, now())
  where id = p_eleve_id
  returning * into v_eleve;
  return v_eleve;
end;
$$;

grant execute on function
  public.creer_classe, public.creer_eleve, public.modifier_eleve,
  public.definir_statut_eleve, public.definir_photo_eleve
to authenticated;
