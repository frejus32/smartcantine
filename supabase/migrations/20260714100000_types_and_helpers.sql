-- =============================================================================
-- SmartCantine — Migration 1 : extensions, types énumérés, fonctions utilitaires
-- =============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid(), crypt() pour le seed

-- Les fonctions helpers référencent des tables créées dans les migrations suivantes ;
-- on diffère la validation de leur corps à l'exécution (pratique standard Supabase).
set check_function_bodies = off;

-- Types métier fermés : un rôle ou un niveau invalide est rejeté par le moteur,
-- pas par du code applicatif qu'on peut oublier d'appeler.
create type public.role_utilisateur as enum ('admin', 'responsable', 'agent');
create type public.niveau_scolaire  as enum ('maternelle', 'primaire', 'college');
create type public.statut_eleve     as enum ('actif', 'desactive');

-- Schéma "private" : fonctions internes non exposées par l'API PostgREST.
create schema if not exists private;

-- updated_at automatique — aucune table ne dépend de la discipline du développeur.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Contexte du demandeur pour les politiques RLS.
-- SECURITY DEFINER : lit public.profils sans déclencher la RLS de profils
-- (sinon récursion : la politique de profils appellerait une fonction qui lit profils).
-- STABLE : évalué une fois par requête, pas une fois par ligne.
-- search_path vidé : immunise contre le détournement par un schéma malveillant.
-- ---------------------------------------------------------------------------
create or replace function private.etablissement_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select etablissement_id from public.profils where id = auth.uid();
$$;

create or replace function private.user_role()
returns public.role_utilisateur
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profils where id = auth.uid();
$$;

-- La session provient-elle de la clé service_role (backend de l'éditeur) ?
create or replace function private.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

-- Les politiques RLS s'évaluent avec les privilèges de l'appelant :
-- le rôle authenticated doit pouvoir résoudre les fonctions du schéma private.
grant usage on schema private to authenticated, service_role;
grant execute on all functions in schema private to authenticated, service_role;
alter default privileges in schema private
  grant execute on functions to authenticated, service_role;
