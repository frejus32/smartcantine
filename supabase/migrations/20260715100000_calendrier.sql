-- =============================================================================
-- SmartCantine — Migration 6 : calendrier scolaire et calcul des quotas
-- Le calendrier gouverne les QUOTAS (combien de repas vaut un mois),
-- jamais le droit de servir un jour donné (décision terrain).
-- =============================================================================

set check_function_bodies = off;

create type public.type_jour_exceptionnel as enum ('ferie', 'vacances', 'fermeture');

-- ---------------------------------------------------------------------------
-- Année scolaire : bornes + jours d'ouverture hebdomadaires de la cantine.
-- jours_semaine : jours ISO (1 = lundi … 7 = dimanche), défaut lundi-vendredi.
-- ---------------------------------------------------------------------------
create table public.annees_scolaires (
  id               uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references public.etablissements (id) on delete restrict,
  libelle          text not null check (char_length(libelle) between 4 and 40),
  date_debut       date not null,
  date_fin         date not null,
  jours_semaine    smallint[] not null default '{1,2,3,4,5}',
  actif            boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  check (date_fin > date_debut),
  check (date_fin - date_debut <= 400),           -- une année scolaire, pas un bail
  check (array_length(jours_semaine, 1) between 1 and 7),
  check (jours_semaine <@ '{1,2,3,4,5,6,7}'::smallint[]),
  unique (etablissement_id, libelle),
  unique (id, etablissement_id)                    -- cible des FK composites
);

-- Une seule année active par établissement.
create unique index annees_scolaires_active_unique
  on public.annees_scolaires (etablissement_id) where actif;

create trigger set_updated_at
  before update on public.annees_scolaires
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Jours exceptionnels : fériés, vacances, fermetures — les jours SOUSTRAITS.
-- ---------------------------------------------------------------------------
create table public.jours_exceptionnels (
  id                uuid primary key default gen_random_uuid(),
  etablissement_id  uuid not null,
  annee_scolaire_id uuid not null,
  jour              date not null,
  type              public.type_jour_exceptionnel not null,
  motif             text not null check (char_length(motif) between 2 and 200),
  created_at        timestamptz not null default now(),

  unique (annee_scolaire_id, jour),
  foreign key (annee_scolaire_id, etablissement_id)
    references public.annees_scolaires (id, etablissement_id) on delete cascade
);

create index jours_exceptionnels_annee_idx
  on public.jours_exceptionnels (annee_scolaire_id, jour);

-- Un jour exceptionnel doit tomber dans les bornes de son année scolaire.
create or replace function private.guard_jour_exceptionnel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_annee public.annees_scolaires%rowtype;
begin
  select * into v_annee from public.annees_scolaires where id = new.annee_scolaire_id;
  if new.jour < v_annee.date_debut or new.jour > v_annee.date_fin then
    raise exception 'Le jour % est hors des bornes de l''année scolaire %.', new.jour, v_annee.libelle
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger guard_jour_exceptionnel
  before insert or update on public.jours_exceptionnels
  for each row execute function private.guard_jour_exceptionnel();

-- ---------------------------------------------------------------------------
-- Cœur du calcul : un jour donné est-il un jour de cantine ?
-- Ouvert = dans l'année + jour de semaine ouvré + non exceptionnel.
-- ---------------------------------------------------------------------------
create or replace function public.est_jour_ouvert(p_annee_scolaire_id uuid, p_jour date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.annees_scolaires a
    where a.id = p_annee_scolaire_id
      and p_jour between a.date_debut and a.date_fin
      and extract(isodow from p_jour)::smallint = any (a.jours_semaine)
      and not exists (
        select 1 from public.jours_exceptionnels j
        where j.annee_scolaire_id = a.id and j.jour = p_jour
      )
  );
$$;

-- Nombre de jours de cantine sur un intervalle (bornes incluses, rognées à l'année).
create or replace function private.compter_jours_ouverts(
  p_annee_scolaire_id uuid, p_du date, p_au date
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.annees_scolaires a
  cross join lateral generate_series(
    greatest(p_du, a.date_debut), least(p_au, a.date_fin), interval '1 day'
  ) as g(jour)
  where a.id = p_annee_scolaire_id
    and extract(isodow from g.jour)::smallint = any (a.jours_semaine)
    and not exists (
      select 1 from public.jours_exceptionnels j
      where j.annee_scolaire_id = a.id and j.jour = g.jour::date
    );
$$;

-- Quota d'un mois calendaire complet : LE chiffre que voit l'économe.
create or replace function public.quota_du_mois(
  p_annee_scolaire_id uuid, p_annee integer, p_mois integer
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select private.compter_jours_ouverts(
    p_annee_scolaire_id,
    make_date(p_annee, p_mois, 1),
    (make_date(p_annee, p_mois, 1) + interval '1 month - 1 day')::date
  );
$$;
