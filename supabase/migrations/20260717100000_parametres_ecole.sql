-- =============================================================================
-- SmartCantine — Migration 13 : paramètres d'établissement enrichis
-- Ajoute identité (logo, adresse, contacts) et cantine (horaires, service).
-- =============================================================================

set check_function_bodies = off;

alter table public.etablissements
  add column adresse       text,
  add column telephone     text,
  add column email         text,
  add column logo_path     text,       -- bucket public "logos-etablissements"
  add column heure_service time not null default '11:30',
  add column reinit_auto   boolean not null default true; -- crédit mensuel automatique

comment on column public.etablissements.reinit_auto is
  'Si vrai, le quota mensuel est (re)calculé automatiquement en début de mois.';

-- Bucket public des logos (affichés sur badges imprimés : lisibles sans auth).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos-etablissements', 'logos-etablissements', true, 524288,
        array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

create policy "public : lire les logos"
  on storage.objects for select
  using (bucket_id = 'logos-etablissements');

create policy "admin : gerer le logo de son ecole"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos-etablissements'
    and (storage.foldername(name))[1] = private.etablissement_id()::text
    and private.user_role() = 'admin'
  );

create policy "admin : remplacer le logo de son ecole"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos-etablissements'
    and (storage.foldername(name))[1] = private.etablissement_id()::text
    and private.user_role() = 'admin'
  );

-- Mise à jour des paramètres — admin uniquement, établissement forcé.
create or replace function public.modifier_etablissement(
  p_nom text default null,
  p_adresse text default null,
  p_telephone text default null,
  p_email text default null,
  p_ville text default null,
  p_heure_service time default null,
  p_politique public.politique_solde default null,
  p_reinit_auto boolean default null,
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
    adresse = coalesce(p_adresse, adresse),
    telephone = coalesce(p_telephone, telephone),
    email = coalesce(p_email, email),
    ville = coalesce(p_ville, ville),
    heure_service = coalesce(p_heure_service, heure_service),
    politique_solde_epuise = coalesce(p_politique, politique_solde_epuise),
    reinit_auto = coalesce(p_reinit_auto, reinit_auto),
    logo_path = coalesce(p_logo_path, logo_path)
  where id = v_profil.etablissement_id
  returning * into v_etab;
  return v_etab;
end;
$$;

grant execute on function public.modifier_etablissement to authenticated;
