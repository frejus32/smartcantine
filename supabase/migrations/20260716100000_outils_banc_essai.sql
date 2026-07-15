-- =============================================================================
-- SmartCantine — Migration 10 : outil du banc d'essai (Sprint 3.5)
-- OUTIL DE TEST, PAS UNE RÈGLE MÉTIER. Permet de prouver visuellement que
-- l'unicité du repas est bien PAR JOUR (un passage d'hier ne bloque pas
-- aujourd'hui), chose impossible via enregistrer_passage() — par conception.
-- Verrouillé : admins uniquement, et refusé si app.environnement = 'production'.
-- =============================================================================

set check_function_bodies = off;

create or replace function public.banc_essai_passage_veille(p_eleve_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_profil  public.profils%rowtype;
  v_passage uuid;
begin
  if coalesce(current_setting('app.environnement', true), 'developpement') = 'production' then
    raise exception 'Outil de banc d''essai désactivé en production.'
      using errcode = 'insufficient_privilege';
  end if;

  v_profil := private.exiger_role(array['admin']::public.role_utilisateur[]);
  perform private.exiger_eleve(p_eleve_id, v_profil.etablissement_id);

  begin
    insert into public.passages
      (etablissement_id, eleve_id, date_service, statut, horodatage, auteur_id)
    values
      (v_profil.etablissement_id, p_eleve_id, current_date - 1, 'servi',
       now() - interval '1 day', v_profil.id)
    returning id into v_passage;
  exception when unique_violation then
    raise exception 'Un passage existe déjà hier pour cet élève.' using errcode = 'unique_violation';
  end;

  insert into public.mouvements_repas
    (etablissement_id, eleve_id, type, quantite, passage_id, auteur_id)
  values
    (v_profil.etablissement_id, p_eleve_id, 'consommation', -1, v_passage, v_profil.id);

  return jsonb_build_object('passage_id', v_passage,
    'date_service', to_char(current_date - 1, 'YYYY-MM-DD'),
    'solde', public.solde_eleve(p_eleve_id));
end;
$$;

grant execute on function public.banc_essai_passage_veille to authenticated;
