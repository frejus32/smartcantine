-- =============================================================================
-- SmartCantine — Migration 9 : RLS du domaine repas
-- Lecture ouverte par école et rôle ; AUCUNE politique d'écriture sur les
-- journaux : les fonctions SECURITY DEFINER de la migration 8 sont le seul chemin.
-- =============================================================================

alter table public.annees_scolaires   enable row level security;
alter table public.jours_exceptionnels enable row level security;
alter table public.mouvements_repas   enable row level security;
alter table public.passages           enable row level security;

-- ------------------------- calendrier -------------------------
create policy "membres : lire les annees scolaires"
  on public.annees_scolaires for select
  to authenticated
  using (etablissement_id = private.etablissement_id());

create policy "gestion : creer une annee scolaire"
  on public.annees_scolaires for insert
  to authenticated
  with check (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  );

create policy "gestion : modifier une annee scolaire"
  on public.annees_scolaires for update
  to authenticated
  using (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  )
  with check (etablissement_id = private.etablissement_id());

create policy "membres : lire les jours exceptionnels"
  on public.jours_exceptionnels for select
  to authenticated
  using (etablissement_id = private.etablissement_id());

create policy "gestion : gerer les jours exceptionnels"
  on public.jours_exceptionnels for insert
  to authenticated
  with check (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  );

create policy "gestion : supprimer un jour exceptionnel"
  on public.jours_exceptionnels for delete
  to authenticated
  using (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  );

-- ------------------------- journaux (lecture seule) -------------------------
create policy "gestion : lire le grand livre"
  on public.mouvements_repas for select
  to authenticated
  using (
    etablissement_id = private.etablissement_id()
    and private.user_role() in ('admin', 'responsable')
  );

create policy "membres : lire les passages de son ecole"
  on public.passages for select
  to authenticated
  using (etablissement_id = private.etablissement_id());
-- Aucune politique INSERT/UPDATE/DELETE sur mouvements_repas ni passages :
-- toute écriture passe par les fonctions métier, ou n'a pas lieu.
