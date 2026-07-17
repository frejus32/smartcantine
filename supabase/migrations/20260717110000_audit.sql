-- =============================================================================
-- SmartCantine — Migration 14 : journal d'audit
-- Trace les actions sensibles (paramètres, rôles, ajustements de solde,
-- annulations). Append-only comme le grand livre : preuve inviolable.
-- =============================================================================

set check_function_bodies = off;

create table public.journal_audit (
  id               bigint generated always as identity primary key,
  etablissement_id uuid not null references public.etablissements (id) on delete cascade,
  auteur_id        uuid references auth.users (id),
  auteur_nom       text,
  action           text not null,
  cible            text,
  details          jsonb,
  created_at       timestamptz not null default now()
);

create index journal_audit_idx on public.journal_audit (etablissement_id, created_at desc);

alter table public.journal_audit enable row level security;

create policy "admin : lire le journal d'audit"
  on public.journal_audit for select
  to authenticated
  using (etablissement_id = private.etablissement_id() and private.user_role() = 'admin');
-- Aucune policy d'écriture : seules les fonctions SECURITY DEFINER journalisent.

create trigger journal_audit_append_only
  before update or delete on public.journal_audit
  for each row execute function private.interdire_modification();

-- Helper interne de journalisation, appelé par les fonctions métier.
create or replace function private.journaliser(
  p_action text, p_cible text default null, p_details jsonb default null
)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare v_profil public.profils%rowtype;
begin
  select * into v_profil from public.profils where id = auth.uid();
  if not found then return; end if;
  insert into public.journal_audit
    (etablissement_id, auteur_id, auteur_nom, action, cible, details)
  values
    (v_profil.etablissement_id, v_profil.id, v_profil.nom_complet, p_action, p_cible, p_details);
end;
$$;

grant execute on function private.journaliser to authenticated, service_role;

create or replace function public.lister_audit(p_limite integer default 50)
returns setof public.journal_audit
language sql stable security definer set search_path = ''
as $$
  select a.* from public.journal_audit a
  join public.profils p on p.id = auth.uid()
  where a.etablissement_id = p.etablissement_id and p.role = 'admin'
  order by a.created_at desc
  limit least(p_limite, 200);
$$;

grant execute on function public.lister_audit to authenticated;
