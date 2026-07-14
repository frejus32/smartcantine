-- =============================================================================
-- SmartCantine — Migration 5 : bucket privé des photos d'élèves
-- Convention de chemin : {etablissement_id}/{eleve_id}.jpg
-- Le premier segment du chemin EST la frontière de sécurité.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos-eleves',
  'photos-eleves',
  false,                      -- privé : accès via URL signée uniquement
  1048576,                    -- 1 Mo max par photo (ENF-06 : appareils modestes)
  array['image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "membres : lire les photos de son ecole"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'photos-eleves'
    and (storage.foldername(name))[1] = private.etablissement_id()::text
  );

create policy "gestion : deposer une photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos-eleves'
    and (storage.foldername(name))[1] = private.etablissement_id()::text
    and private.user_role() in ('admin', 'responsable')
  );

create policy "gestion : remplacer une photo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'photos-eleves'
    and (storage.foldername(name))[1] = private.etablissement_id()::text
    and private.user_role() in ('admin', 'responsable')
  );

create policy "gestion : supprimer une photo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos-eleves'
    and (storage.foldername(name))[1] = private.etablissement_id()::text
    and private.user_role() in ('admin', 'responsable')
  );
