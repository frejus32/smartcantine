-- =============================================================================
-- SmartCantine — Migration 3 : classes et élèves
-- =============================================================================

create table public.classes (
  id               uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references public.etablissements (id) on delete restrict,
  nom              text not null check (char_length(nom) between 1 and 60),
  niveau           public.niveau_scolaire not null,
  actif            boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (etablissement_id, nom),
  -- Cible du FK composite des élèves : rend impossible le rattachement
  -- d'un élève à une classe d'une AUTRE école (intégrité multi-tenant par le moteur).
  unique (id, etablissement_id)
);

create index classes_etablissement_idx on public.classes (etablissement_id);

create trigger set_updated_at
  before update on public.classes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Élèves. Jamais supprimés (l'historique des passages arrive au Sprint 3) :
-- on les désactive (statut = 'desactive').
-- ---------------------------------------------------------------------------
create table public.eleves (
  id                 uuid primary key default gen_random_uuid(),
  etablissement_id   uuid not null references public.etablissements (id) on delete restrict,
  classe_id          uuid not null,
  matricule          text not null check (char_length(matricule) between 1 and 30),
  nom                text not null check (char_length(nom) between 1 and 80),
  prenoms            text not null check (char_length(prenoms) between 1 and 120),
  date_naissance     date check (date_naissance > date '1990-01-01' and date_naissance < now()),
  photo_path         text, -- chemin dans le bucket privé "photos-eleves"
  consentement_photo boolean not null default false,
  consentement_date  timestamptz,
  statut             public.statut_eleve not null default 'actif',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Un matricule est unique DANS une école (deux écoles peuvent avoir "0001").
  unique (etablissement_id, matricule),

  -- Cible des FK composites du Sprint 3 (passages, compteurs) : même principe anti-fuite.
  unique (id, etablissement_id),

  -- FK composite : la classe doit appartenir à la même école que l'élève.
  foreign key (classe_id, etablissement_id)
    references public.classes (id, etablissement_id) on delete restrict,

  -- Un consentement accordé est daté ; PRD EF-A4 (traçabilité du consentement).
  check (consentement_photo = false or consentement_date is not null)
);

comment on column public.eleves.photo_path is
  'Clé d''objet Storage : {etablissement_id}/{eleve_id}.jpg — jamais d''URL publique.';

create index eleves_classe_idx        on public.eleves (classe_id);
create index eleves_recherche_idx     on public.eleves (etablissement_id, nom, prenoms);
create index eleves_statut_idx        on public.eleves (etablissement_id, statut);

create trigger set_updated_at
  before update on public.eleves
  for each row execute function private.set_updated_at();

-- L'école d'un élève est immuable (pas de transfert inter-tenant hors service).
create or replace function private.guard_eleve_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_service_role()
     and new.etablissement_id is distinct from old.etablissement_id then
    raise exception 'L''établissement d''un élève ne peut pas être modifié.';
  end if;
  return new;
end;
$$;

create trigger guard_eleve_update
  before update on public.eleves
  for each row execute function private.guard_eleve_update();
