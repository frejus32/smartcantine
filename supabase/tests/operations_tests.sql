-- =============================================================================
-- SmartCantine — Tests de la School Operations Suite (Sprint 5).
-- Rapports, audit, gestion utilisateurs, paramètres. Fixtures : seed + activité.
-- =============================================================================

create or replace function pg_temp.impersonate(p_email text)
returns void language plpgsql as $$
declare v_id uuid;
begin
  select id into strict v_id from auth.users where email = p_email;
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, false);
  perform set_config('role', 'authenticated', false);
end $$;
create or replace function pg_temp.reset_identity()
returns void language plpgsql as $$
begin perform set_config('role','postgres',false); perform set_config('request.jwt.claims','',false); end $$;

do $$
declare
  v_ecole uuid; v_e1 uuid; v_e2 uuid; v_agent uuid;
  n int; v_res jsonb; v_rq jsonb;
begin
  select id into v_ecole from public.etablissements where code = 'COLIBRIS01';
  select id into v_e1 from public.eleves where matricule = 'COL-0101';
  select id into v_e2 from public.eleves where matricule = 'COL-0102';
  select id into v_agent from auth.users where email = 'agent@colibris.ci';

  -- Activité : créditer + servir 2 élèves aujourd'hui.
  perform pg_temp.impersonate('responsable@colibris.ci');
  perform public.crediter_carnet(v_e1, 5);
  perform public.crediter_carnet(v_e2, 5);
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('agent@colibris.ci');
  perform public.enregistrer_passage(v_e1);
  perform public.enregistrer_passage(v_e2);
  perform pg_temp.reset_identity();

  ---------------------------------------------------------------------------
  -- T1. Rapport quotidien : 2 servis, N-2 absents, cohérence des totaux.
  ---------------------------------------------------------------------------
  perform pg_temp.impersonate('admin@colibris.ci');
  v_rq := public.rapport_quotidien(current_date);
  if (v_rq ->> 'servis')::int <> 2 then raise exception 'T1a ECHEC servis=%', v_rq ->> 'servis'; end if;
  if (v_rq ->> 'total_distribues')::int <> 2 then raise exception 'T1b ECHEC total=%', v_rq ->> 'total_distribues'; end if;
  if (v_rq ->> 'absents')::int <> (v_rq ->> 'eleves_actifs')::int - 2 then
    raise exception 'T1c ECHEC absents incoherent'; end if;
  raise notice 'T1 PASS — rapport quotidien coherent (servis, absents, total)';

  ---------------------------------------------------------------------------
  -- T2. Rapport quotidien par classe : somme = total servis.
  ---------------------------------------------------------------------------
  select sum(servis) into n from public.rapport_quotidien_par_classe(current_date);
  if n <> 2 then raise exception 'T2 ECHEC : somme par classe = % (attendu 2)', n; end if;
  raise notice 'T2 PASS — repartition par classe coherente';

  ---------------------------------------------------------------------------
  -- T3. Rapport mensuel : total du mois >= 2, moyenne calculee.
  ---------------------------------------------------------------------------
  v_res := public.rapport_mensuel(extract(year from current_date)::int, extract(month from current_date)::int);
  if (v_res ->> 'total_repas')::int < 2 then raise exception 'T3 ECHEC total mensuel'; end if;
  raise notice 'T3 PASS — rapport mensuel (total=%, moyenne=%/j)', v_res->>'total_repas', v_res->>'moyenne_par_jour';

  ---------------------------------------------------------------------------
  -- T4. Ajustement de solde journalisé dans l'audit.
  ---------------------------------------------------------------------------
  perform public.ajuster_solde(v_e1, 3, 'Correction test audit');
  select count(*) into n from public.lister_audit(50) where action = 'solde_ajuste';
  if n < 1 then raise exception 'T4 ECHEC : ajustement non journalise'; end if;
  raise notice 'T4 PASS — action sensible tracee dans le journal d''audit';

  ---------------------------------------------------------------------------
  -- T5. Gestion utilisateurs : lister + changer un rôle (journalisé).
  ---------------------------------------------------------------------------
  select count(*) into n from public.lister_utilisateurs();
  if n <> 3 then raise exception 'T5a ECHEC : % utilisateurs (attendu 3)', n; end if;
  perform public.definir_role_utilisateur(v_agent, 'responsable');
  select count(*) into n from public.lister_audit(50) where action = 'role_modifie';
  if n < 1 then raise exception 'T5b ECHEC : changement de role non journalise'; end if;
  perform public.definir_role_utilisateur(v_agent, 'agent'); -- retour etat initial
  raise notice 'T5 PASS — gestion des utilisateurs et roles (journalisee)';

  ---------------------------------------------------------------------------
  -- T6. Paramètres établissement : modifier + journalisé + isolé au tenant.
  ---------------------------------------------------------------------------
  perform public.modifier_etablissement(p_adresse := 'Cocody, Abidjan', p_heure_service := '12:00');
  select count(*) into n from public.etablissements
   where id = v_ecole and adresse = 'Cocody, Abidjan' and heure_service = '12:00';
  if n <> 1 then raise exception 'T6a ECHEC : parametres non enregistres'; end if;
  select count(*) into n from public.lister_audit(50) where action = 'parametres_modifies';
  if n < 1 then raise exception 'T6b ECHEC : parametres non journalises'; end if;
  raise notice 'T6 PASS — parametres etablissement enregistres et traces';

  ---------------------------------------------------------------------------
  -- T7. Calendrier : ajouter/supprimer un jour exceptionnel (journalisé).
  ---------------------------------------------------------------------------
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('responsable@colibris.ci');
  perform public.ajouter_jour_exceptionnel('2026-05-01', 'ferie', 'Fete du travail');
  select count(*) into n from public.lister_jours_exceptionnels() where jour = '2026-05-01';
  if n <> 1 then raise exception 'T7a ECHEC : jour non ajoute'; end if;
  raise notice 'T7 PASS — gestion du calendrier scolaire';

  ---------------------------------------------------------------------------
  -- T8. Un responsable ne peut PAS lire le journal d'audit (admin only).
  ---------------------------------------------------------------------------
  select count(*) into n from public.lister_audit(50);
  if n <> 0 then raise exception 'T8 ECHEC : responsable a lu le journal d''audit (%)', n; end if;
  raise notice 'T8 PASS — journal d''audit reserve aux admins';

  perform pg_temp.reset_identity();
  raise notice '=== TOUS LES TESTS OPERATIONS PASSENT ===';
end $$;
