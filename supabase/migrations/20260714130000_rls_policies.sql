-- =============================================================================
-- SmartCantine — Migration 4 : Row Level Security
-- Philosophie : tout est fermé par défaut ; chaque ouverture est explicite.
-- L'absence de politique DELETE sur eleves/profils/etablissements = suppression interdite.
-- =============================================================================

alter table public.etablissements enable row level security;
alter table public.profils        enable row level security;
alter table public.classes       enable row level security;
alter table public.eleves        enable row level security;

-- --------------------------- etablissements --------------------------------
-- Lecture : les membres voient leur école. Création/suppression : service_role uniquement.
create policy "membres : lire son etablissement"
  on public.etablissements for select
  to authenticated
  using (id = private.etablissement_id());

create policy "admin : modifier son etablissement"
  on public.etablissements for update
  to authenticated
  using (id = private.etablissement_id() and private.user_role() = 'admin')
  with check (id = private.etablissement_id());

-- ------------------------------- profils -----------------------------------
create policy "membres : lire les profils de son ecole"
  on public.profils for select
  to authenticated
  using (etablissement_id = private.etablissement_id());

create policy "chacun : modifier son propre profil"
  on public.profils for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin : modifier les profils de son ecole"
  on public.profils for update
  to authenticated
  using (etablissement_id = private.etablissement_id() and private.user_role() = 'admin')
  with check (etablissement_id = private.etablissement_id());
-- (Les colonnes sensibles — role, etablissement_id — restent verrouillées par trigger.)

-- ------------------------------- classes -----------------------------------
create policy "membres : lire les classes de son ecole"
  on public.classes for select
  to authenticated
  using (etablissement_id = private.etablissement_id());

create policy "gestion : creer une classe"
  on public.classes for insert
  to authenticated
  with check (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  );

create policy "gestion : modifier une classe"
  on public.classes for update
  to authenticated
  using (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  )
  with check (etablissement_id = private.etablissement_id());

create policy "admin : supprimer une classe vide"
  on public.classes for delete
  to authenticated
  using (
    etablissement_id = private.etablissement_id()
    and private.user_role() = 'admin'
  );
-- (Une classe contenant des élèves est protégée par le FK ON DELETE RESTRICT.)

-- -------------------------------- eleves -----------------------------------
-- Lecture ouverte à TOUS les rôles de l'école : l'agent en aura besoin au scan (Sprint 4).
create policy "membres : lire les eleves de son ecole"
  on public.eleves for select
  to authenticated
  using (etablissement_id = private.etablissement_id());

create policy "gestion : inscrire un eleve"
  on public.eleves for insert
  to authenticated
  with check (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  );

create policy "gestion : modifier un eleve"
  on public.eleves for update
  to authenticated
  using (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  )
  with check (etablissement_id = private.etablissement_id());
-- Pas de politique DELETE : un élève se désactive, ne se supprime pas (historique).
