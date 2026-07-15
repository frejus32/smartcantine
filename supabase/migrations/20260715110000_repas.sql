-- =============================================================================
-- SmartCantine — Migration 7 : journal des repas (append-only) et passages
-- Deux garanties portées par le MOTEUR, pas par le code applicatif :
--   1. Unicité du repas : index unique partiel (eleve, date, service).
--   2. Journal inviolable : triggers bloquant UPDATE/DELETE — y compris
--      pour service_role (les triggers s'appliquent à tous, contrairement à la RLS).
-- =============================================================================

create type public.type_mouvement  as enum ('credit_mois', 'credit_carnet', 'consommation', 'ajustement');
create type public.type_service    as enum ('dejeuner');            -- RG-07 : extensible en V2
create type public.statut_passage  as enum ('servi', 'a_regulariser', 'annule');
create type public.politique_solde as enum ('strict', 'dette');

-- Paramètre d'établissement : comportement à solde épuisé (PRD EF-E5).
alter table public.etablissements
  add column politique_solde_epuise public.politique_solde not null default 'dette';

-- ---------------------------------------------------------------------------
-- Passages : un repas accordé (servi ou à régulariser). Le refus « déjà servi »
-- n'est PAS un passage — le journal des scans (tous verdicts) arrive au Sprint 3B.
-- ---------------------------------------------------------------------------
create table public.passages (
  id               uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null,
  eleve_id         uuid not null,
  date_service     date not null default current_date,
  type_service     public.type_service not null default 'dejeuner',
  statut           public.statut_passage not null,
  horodatage       timestamptz not null default now(),
  auteur_id        uuid not null references auth.users (id),
  annule_a         timestamptz,
  annule_par       uuid references auth.users (id),

  check (statut <> 'annule' or (annule_a is not null and annule_par is not null)),
  foreign key (eleve_id, etablissement_id)
    references public.eleves (id, etablissement_id) on delete restrict
);

comment on table public.passages is
  'Repas accordés. La règle « un élève = un repas par jour » est portée par l''index unique partiel.';

-- ============================ LA CONTRAINTE D'OR ============================
-- Un seul passage non annulé par élève, par jour, par service.
-- Même deux transactions strictement simultanées ne peuvent pas la violer.
create unique index passages_unicite_repas
  on public.passages (eleve_id, date_service, type_service)
  where statut <> 'annule';
-- ============================================================================

create index passages_rapport_idx on public.passages (etablissement_id, date_service);
create index passages_eleve_idx   on public.passages (eleve_id, date_service desc);

-- ---------------------------------------------------------------------------
-- Mouvements de repas : le grand livre. Solde d'un élève = somme des quantités.
-- Crédits > 0, consommations = -1, ajustements ≠ 0 (contre-écritures motivées).
-- ---------------------------------------------------------------------------
create table public.mouvements_repas (
  id               uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null,
  eleve_id         uuid not null,
  type             public.type_mouvement not null,
  quantite         integer not null,
  periode          date,                                   -- 1er du mois pour credit_mois
  passage_id       uuid references public.passages (id),   -- lien consommation/annulation
  motif            text,
  auteur_id        uuid not null references auth.users (id),
  created_at       timestamptz not null default now(),

  check (quantite <> 0),
  check (type <> 'credit_mois'    or (quantite > 0 and periode is not null
                                      and periode = date_trunc('month', periode)::date)),
  check (type <> 'credit_carnet'  or (quantite between 1 and 200)),
  check (type <> 'consommation'   or (quantite = -1 and passage_id is not null)),
  check (type <> 'ajustement'     or (motif is not null and char_length(motif) >= 3)),
  foreign key (eleve_id, etablissement_id)
    references public.eleves (id, etablissement_id) on delete restrict
);

comment on table public.mouvements_repas is
  'Grand livre append-only : jamais de UPDATE ni de DELETE, corrections par contre-écriture.';

create index mouvements_solde_idx   on public.mouvements_repas (eleve_id);
create index mouvements_journal_idx on public.mouvements_repas (etablissement_id, created_at desc);

-- Un seul crédit « mois » par élève et par mois (RG : pas de double facturation).
create unique index mouvements_credit_mois_unique
  on public.mouvements_repas (eleve_id, periode)
  where type = 'credit_mois';

-- ---------------------------------------------------------------------------
-- Append-only : le journal n'est modifiable par PERSONNE, service_role compris.
-- ---------------------------------------------------------------------------
create or replace function private.interdire_modification()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Table % : journal en insertion seule — corrigez par contre-écriture.', tg_table_name
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger mouvements_append_only
  before update or delete on public.mouvements_repas
  for each row execute function private.interdire_modification();

-- Passages : DELETE interdit ; UPDATE limité à la seule transition d'annulation
-- (statut -> 'annule', sous 5 minutes, sans toucher aux autres colonnes).
create or replace function private.guard_passage_update()
returns trigger
language plpgsql
as $$
begin
  if old.statut = 'annule'
     or new.statut <> 'annule'
     or new.eleve_id         is distinct from old.eleve_id
     or new.etablissement_id is distinct from old.etablissement_id
     or new.date_service     is distinct from old.date_service
     or new.type_service     is distinct from old.type_service
     or new.horodatage       is distinct from old.horodatage
     or new.auteur_id        is distinct from old.auteur_id then
    raise exception 'Passages : seule l''annulation est autorisée, rien d''autre n''est modifiable.'
      using errcode = 'insufficient_privilege';
  end if;
  if now() - old.horodatage > interval '5 minutes' then
    raise exception 'Annulation impossible : le délai de 5 minutes est dépassé.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger passages_guard_update
  before update on public.passages
  for each row execute function private.guard_passage_update();

create trigger passages_no_delete
  before delete on public.passages
  for each row execute function private.interdire_modification();

-- ---------------------------------------------------------------------------
-- Solde d'un élève : la somme du grand livre, toujours exacte par construction.
-- ---------------------------------------------------------------------------
create or replace function public.solde_eleve(p_eleve_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(m.quantite), 0)::integer
  from public.mouvements_repas m
  join public.profils p on p.id = auth.uid()
  where m.eleve_id = p_eleve_id
    and m.etablissement_id = p.etablissement_id;
$$;
