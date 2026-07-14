-- =============================================================================
-- SmartCantine — Migration 2 : établissements et profils utilisateurs
-- =============================================================================

create table public.etablissements (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique
              check (code ~ '^[A-Z0-9]{3,12}$'), -- identifiant support lisible : "COLIBRIS01"
  nom         text not null check (char_length(nom) between 2 and 160),
  ville       text,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.etablissements is
  'Tenant racine : toute donnée métier est rattachée à un établissement.';

create trigger set_updated_at
  before update on public.etablissements
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profils : prolonge auth.users avec le contexte métier (école + rôle).
-- La ligne est créée par le backend de l'éditeur (service_role) à l'embarquement.
-- ---------------------------------------------------------------------------
create table public.profils (
  id               uuid primary key references auth.users (id) on delete cascade,
  etablissement_id uuid not null references public.etablissements (id) on delete restrict,
  role             public.role_utilisateur not null default 'agent',
  nom_complet      text not null check (char_length(nom_complet) between 1 and 120),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.profils is
  'Source de vérité du rôle et de l''école d''un utilisateur. Synchronisé vers le JWT.';

create index profils_etablissement_idx on public.profils (etablissement_id);

create trigger set_updated_at
  before update on public.profils
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Synchronisation profils -> auth.users.app_metadata.
-- Le middleware Next.js lit le rôle dans le JWT sans requête supplémentaire ;
-- cette synchro garantit que JWT et base ne divergent jamais.
-- ---------------------------------------------------------------------------
create or replace function private.sync_profil_to_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
         || jsonb_build_object('role', new.role, 'etablissement_id', new.etablissement_id)
   where id = new.id;
  return new;
end;
$$;

create trigger sync_profil_to_auth
  after insert or update of role, etablissement_id on public.profils
  for each row execute function private.sync_profil_to_auth();

-- ---------------------------------------------------------------------------
-- Garde-fous d'écriture (les politiques RLS filtrent les lignes,
-- les triggers protègent les colonnes sensibles) :
--   * l'école d'un profil est immuable hors service_role ;
--   * seul un admin (ou le service) peut changer un rôle ;
--   * personne ne peut modifier son propre rôle, même admin.
-- ---------------------------------------------------------------------------
create or replace function private.guard_profil_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_service_role() then
    return new;
  end if;

  if new.etablissement_id is distinct from old.etablissement_id then
    raise exception 'L''établissement d''un profil ne peut pas être modifié.';
  end if;

  if new.role is distinct from old.role then
    if auth.uid() = old.id then
      raise exception 'Vous ne pouvez pas modifier votre propre rôle.';
    end if;
    if private.user_role() is distinct from 'admin' then
      raise exception 'Seul un administrateur peut modifier un rôle.';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_profil_update
  before update on public.profils
  for each row execute function private.guard_profil_update();
