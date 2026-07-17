-- =============================================================================
-- SmartCantine — Migration 15 : gestion des utilisateurs + branchement audit
-- =============================================================================

set check_function_bodies = off;

-- Liste des membres de l'établissement (admin uniquement).
create or replace function public.lister_utilisateurs()
returns table (id uuid, nom_complet text, role public.role_utilisateur, email text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select pr.id, pr.nom_complet, pr.role, u.email, pr.created_at
  from public.profils pr
  join public.profils moi on moi.id = auth.uid()
  join auth.users u on u.id = pr.id
  where pr.etablissement_id = moi.etablissement_id and moi.role = 'admin'
  order by pr.created_at;
$$;

-- Changer le rôle d'un membre (admin ; garde-fous existants au niveau trigger).
create or replace function public.definir_role_utilisateur(p_user_id uuid, p_role public.role_utilisateur)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_cible public.profils%rowtype;
begin
  v_profil := private.exiger_role(array['admin']::public.role_utilisateur[]);
  select * into v_cible from public.profils
   where id = p_user_id and etablissement_id = v_profil.etablissement_id;
  if not found then
    raise exception 'Utilisateur introuvable dans votre établissement.' using errcode = 'no_data_found';
  end if;
  update public.profils set role = p_role where id = p_user_id;
  perform private.journaliser('role_modifie', v_cible.nom_complet,
    jsonb_build_object('ancien', v_cible.role, 'nouveau', p_role));
end;
$$;

grant execute on function public.lister_utilisateurs, public.definir_role_utilisateur
  to authenticated;

-- Rebrancher les fonctions sensibles pour qu'elles journalisent -------------
-- (on remplace les corps existants en ajoutant l'appel à private.journaliser)

create or replace function public.ajuster_solde(p_eleve_id uuid, p_quantite integer, p_motif text)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype;
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
  perform private.journaliser('solde_ajuste', p_eleve_id::text,
    jsonb_build_object('quantite', p_quantite, 'motif', trim(p_motif)));
  return jsonb_build_object('solde', public.solde_eleve(p_eleve_id));
end;
$$;

create or replace function public.modifier_etablissement(
  p_nom text default null, p_adresse text default null, p_telephone text default null,
  p_email text default null, p_ville text default null, p_heure_service time default null,
  p_politique public.politique_solde default null, p_reinit_auto boolean default null,
  p_logo_path text default null
)
returns public.etablissements
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype; v_etab public.etablissements%rowtype;
begin
  v_profil := private.exiger_role(array['admin']::public.role_utilisateur[]);
  update public.etablissements set
    nom = coalesce(nullif(trim(p_nom), ''), nom),
    adresse = coalesce(p_adresse, adresse), telephone = coalesce(p_telephone, telephone),
    email = coalesce(p_email, email), ville = coalesce(p_ville, ville),
    heure_service = coalesce(p_heure_service, heure_service),
    politique_solde_epuise = coalesce(p_politique, politique_solde_epuise),
    reinit_auto = coalesce(p_reinit_auto, reinit_auto),
    logo_path = coalesce(p_logo_path, logo_path)
  where id = v_profil.etablissement_id
  returning * into v_etab;
  perform private.journaliser('parametres_modifies', null, jsonb_build_object('nom', v_etab.nom));
  return v_etab;
end;
$$;

grant execute on function public.modifier_etablissement to authenticated;
