-- =============================================================================
-- SmartCantine — Tests du Business Core (Sprint 3A).
-- Fixtures : année scolaire 2026-2027 des Colibris + 3 jours exceptionnels.
-- Chaque assertion échoue bruyamment.
-- =============================================================================

-- Outils d'usurpation d'identité (mêmes que rls_tests).
create or replace function pg_temp.impersonate(p_email text)
returns void language plpgsql as $$
declare v_id uuid;
begin
  select id into strict v_id from auth.users where email = p_email;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_id, 'role', 'authenticated')::text, false);
  perform set_config('role', 'authenticated', false);
end $$;

create or replace function pg_temp.reset_identity()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', false);
  perform set_config('request.jwt.claims', '', false);
end $$;

-- ----------------------------- Fixtures calendrier -----------------------------
do $$
declare
  v_ecole uuid;
  v_annee uuid;
begin
  select id into v_ecole from public.etablissements where code = 'COLIBRIS01';

  insert into public.annees_scolaires (etablissement_id, libelle, date_debut, date_fin)
  values (v_ecole, '2026-2027', '2026-09-01', '2027-06-30')
  returning id into v_annee;

  insert into public.jours_exceptionnels (etablissement_id, annee_scolaire_id, jour, type, motif) values
    (v_ecole, v_annee, '2026-11-02', 'vacances',  'Vacances de Toussaint'),
    (v_ecole, v_annee, '2026-11-16', 'ferie',     'Journée nationale de la paix'),
    (v_ecole, v_annee, '2026-11-27', 'fermeture', 'Travaux cuisine');
end $$;

-- =============================================================================
do $$
declare
  v_ecole   uuid;
  v_annee   uuid;
  v_e_plein uuid;  -- élève crédité du mois complet
  v_e_pror  uuid;  -- élève crédité au prorata
  v_e_scan  uuid;  -- élève des tests de passage (carnet)
  v_e_zero  uuid;  -- élève à solde nul
  v_e_zero2 uuid;  -- élève à solde nul (politique stricte)
  n         integer;
  v_res     jsonb;
  v_passage uuid;
begin
  select id into v_ecole from public.etablissements where code = 'COLIBRIS01';
  select id into v_annee from public.annees_scolaires where libelle = '2026-2027';
  select id into v_e_plein from public.eleves where matricule = 'COL-0101';
  select id into v_e_pror  from public.eleves where matricule = 'COL-0102';
  select id into v_e_scan  from public.eleves where matricule = 'COL-0103';
  select id into v_e_zero  from public.eleves where matricule = 'COL-0201';
  select id into v_e_zero2 from public.eleves where matricule = 'COL-0202';

  ---------------------------------------------------------------------------
  -- T1. Quota de novembre 2026 : 21 jours ouvrés - 1 vacance - 1 férié
  --     - 1 fermeture = 18. Le calendrier gouverne le chiffre.
  ---------------------------------------------------------------------------
  n := public.quota_du_mois(v_annee, 2026, 11);
  if n <> 18 then raise exception 'T1 ECHEC : quota novembre = % (attendu 18)', n; end if;
  raise notice 'T1 PASS — quota mensuel = jours ouvres moins exceptions (18)';

  ---------------------------------------------------------------------------
  -- T2. Week-ends exclus ; T3. férié / vacances / fermeture exclus ;
  --     hors bornes de l'année exclu.
  ---------------------------------------------------------------------------
  if public.est_jour_ouvert(v_annee, '2026-11-14') then raise exception 'T2 ECHEC : samedi ouvert'; end if;
  if public.est_jour_ouvert(v_annee, '2026-11-15') then raise exception 'T2 ECHEC : dimanche ouvert'; end if;
  raise notice 'T2 PASS — week-ends exclus';

  if public.est_jour_ouvert(v_annee, '2026-11-16') then raise exception 'T3 ECHEC : ferie ouvert'; end if;
  if public.est_jour_ouvert(v_annee, '2026-11-02') then raise exception 'T3 ECHEC : vacances ouvertes'; end if;
  if public.est_jour_ouvert(v_annee, '2026-11-27') then raise exception 'T3 ECHEC : fermeture ouverte'; end if;
  if public.est_jour_ouvert(v_annee, '2026-08-15') then raise exception 'T3 ECHEC : hors annee ouvert'; end if;
  if not public.est_jour_ouvert(v_annee, '2026-11-17') then raise exception 'T3 ECHEC : mardi normal ferme'; end if;
  raise notice 'T3 PASS — ferie, vacances, fermeture, hors-annee exclus';

  ---------------------------------------------------------------------------
  -- T4. Un jour exceptionnel hors des bornes de l'année est rejeté.
  ---------------------------------------------------------------------------
  begin
    insert into public.jours_exceptionnels (etablissement_id, annee_scolaire_id, jour, type, motif)
    values (v_ecole, v_annee, '2027-08-15', 'ferie', 'Hors bornes');
    raise exception 'T4 ECHEC : jour hors annee accepte';
  exception when check_violation then null;
  end;
  raise notice 'T4 PASS — jour exceptionnel borne a son annee scolaire';

  ---------------------------------------------------------------------------
  -- T5. Crédit du mois complet (novembre, futur) = 18 ; double crédit rejeté.
  ---------------------------------------------------------------------------
  perform pg_temp.impersonate('responsable@colibris.ci');
  v_res := public.crediter_mois(v_e_plein, 2026, 11);
  if (v_res ->> 'quota')::int <> 18 then
    raise exception 'T5a ECHEC : credit mois = % (attendu 18)', v_res ->> 'quota';
  end if;
  begin
    perform public.crediter_mois(v_e_plein, 2026, 11);
    raise exception 'T5b ECHEC : double credit du meme mois accepte';
  exception when unique_violation then null;
  end;
  raise notice 'T5 PASS — credit mensuel automatique (18) et anti double-facturation';

  ---------------------------------------------------------------------------
  -- T6. Prorata : inscription au 10 novembre -> 15 jours ouvres - ferie(16)
  --     - fermeture(27) = 13.
  ---------------------------------------------------------------------------
  v_res := public.crediter_mois(v_e_pror, 2026, 11, '2026-11-10');
  if (v_res ->> 'quota')::int <> 13 then
    raise exception 'T6 ECHEC : prorata = % (attendu 13)', v_res ->> 'quota';
  end if;
  if not (v_res ->> 'prorata')::boolean then
    raise exception 'T6 ECHEC : prorata non signale';
  end if;
  raise notice 'T6 PASS — prorata en cours de mois (13)';

  ---------------------------------------------------------------------------
  -- T7. Passage nominal : carnet de 2, scan agent -> VERT, solde 2 -> 1,
  --     mouvement de consommation historise.
  ---------------------------------------------------------------------------
  perform public.crediter_carnet(v_e_scan, 2);
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('agent@colibris.ci');
  v_res := public.enregistrer_passage(v_e_scan);
  if v_res ->> 'verdict' <> 'vert' or (v_res ->> 'solde')::int <> 1 then
    raise exception 'T7 ECHEC : %', v_res;
  end if;
  v_passage := (v_res ->> 'passage_id')::uuid;
  perform pg_temp.reset_identity();
  select count(*) into n from public.mouvements_repas
   where eleve_id = v_e_scan and type = 'consommation';
  if n <> 1 then raise exception 'T7 ECHEC : % mouvements de consommation (attendu 1)', n; end if;
  raise notice 'T7 PASS — verdict vert, solde decremente, mouvement historise';

  ---------------------------------------------------------------------------
  -- T8. Deuxième passage le même jour : ROUGE deja_servi, avec heure,
  --     aucun mouvement supplémentaire. LA règle d'or.
  ---------------------------------------------------------------------------
  perform pg_temp.impersonate('agent@colibris.ci');
  v_res := public.enregistrer_passage(v_e_scan);
  if v_res ->> 'verdict' <> 'rouge' or v_res ->> 'code' <> 'deja_servi'
     or v_res ->> 'heure_premier_passage' is null then
    raise exception 'T8 ECHEC : %', v_res;
  end if;
  perform pg_temp.reset_identity();
  select count(*) into n from public.mouvements_repas
   where eleve_id = v_e_scan and type = 'consommation';
  if n <> 1 then raise exception 'T8 ECHEC : double consommation historisee'; end if;
  raise notice 'T8 PASS — deux repas le meme jour impossibles (rouge + heure)';

  ---------------------------------------------------------------------------
  -- T9. Solde epuise, politique « dette » (defaut) : ORANGE a_regulariser,
  --     solde passe a -1 (la dette se voit).
  ---------------------------------------------------------------------------
  perform pg_temp.impersonate('agent@colibris.ci');
  v_res := public.enregistrer_passage(v_e_zero);
  if v_res ->> 'verdict' <> 'orange' or v_res ->> 'code' <> 'a_regulariser'
     or (v_res ->> 'solde')::int <> -1 then
    raise exception 'T9 ECHEC : %', v_res;
  end if;
  raise notice 'T9 PASS — solde epuise + politique dette : orange, dette tracee (-1)';

  ---------------------------------------------------------------------------
  -- T10. Politique « strict » : ORANGE bloque, AUCUN passage cree.
  ---------------------------------------------------------------------------
  perform pg_temp.reset_identity();
  update public.etablissements set politique_solde_epuise = 'strict' where id = v_ecole;
  perform pg_temp.impersonate('agent@colibris.ci');
  v_res := public.enregistrer_passage(v_e_zero2);
  perform pg_temp.reset_identity();
  update public.etablissements set politique_solde_epuise = 'dette' where id = v_ecole;
  if v_res ->> 'verdict' <> 'orange' or v_res ->> 'code' <> 'solde_epuise_bloque' then
    raise exception 'T10 ECHEC : %', v_res;
  end if;
  select count(*) into n from public.passages where eleve_id = v_e_zero2;
  if n <> 0 then raise exception 'T10 ECHEC : passage cree malgre blocage strict'; end if;
  raise notice 'T10 PASS — politique stricte : orange bloque, aucun passage';

  ---------------------------------------------------------------------------
  -- T11. Fraudes directes rejetees :
  --   a) l'agent ne peut pas s'auto-crediter (role) ;
  --   b) insertion directe dans le grand livre refusee (RLS, aucun chemin) ;
  --   c) UPDATE / DELETE du journal impossibles MEME en superuser (triggers) ;
  --   d) falsification d'un passage (changer la date) impossible.
  ---------------------------------------------------------------------------
  perform pg_temp.impersonate('agent@colibris.ci');
  begin
    perform public.crediter_carnet(v_e_scan, 50);
    raise exception 'T11a ECHEC : un agent a credite des repas';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.mouvements_repas (etablissement_id, eleve_id, type, quantite, auteur_id)
    values (v_ecole, v_e_scan, 'credit_carnet', 50, auth.uid());
    raise exception 'T11b ECHEC : insertion directe dans le grand livre acceptee';
  exception when insufficient_privilege then null;
  end;
  perform pg_temp.reset_identity();
  begin
    update public.mouvements_repas set quantite = 100 where eleve_id = v_e_scan and type = 'credit_carnet';
    raise exception 'T11c ECHEC : grand livre modifiable';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.mouvements_repas where eleve_id = v_e_scan;
    raise exception 'T11c ECHEC : grand livre supprimable';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.passages set date_service = date_service - 1 where id = v_passage;
    raise exception 'T11d ECHEC : date de passage falsifiable';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.passages where id = v_passage;
    raise exception 'T11d ECHEC : passage supprimable';
  exception when insufficient_privilege then null;
  end;
  raise notice 'T11 PASS — toutes les tentatives de fraude rejetees (roles, RLS, append-only)';

  ---------------------------------------------------------------------------
  -- T12. Annulation sous 5 minutes : contre-ecriture +1, re-scan possible.
  ---------------------------------------------------------------------------
  perform pg_temp.impersonate('responsable@colibris.ci');
  v_res := public.annuler_passage(v_passage);
  if (v_res ->> 'solde')::int <> 2 then
    raise exception 'T12a ECHEC : solde apres annulation = % (attendu 2)', v_res ->> 'solde';
  end if;
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('agent@colibris.ci');
  v_res := public.enregistrer_passage(v_e_scan);
  if v_res ->> 'verdict' <> 'vert' then
    raise exception 'T12b ECHEC : re-scan apres annulation refuse : %', v_res;
  end if;
  perform pg_temp.reset_identity();
  select count(*) into n from public.passages
   where eleve_id = v_e_scan and date_service = current_date and statut <> 'annule';
  if n <> 1 then raise exception 'T12c ECHEC : % passages actifs (attendu 1)', n; end if;
  raise notice 'T12 PASS — annulation tracee, contre-ecriture, re-scan autorise';

  raise notice '=== TOUS LES TESTS DU BUSINESS CORE PASSENT ===';
end $$;
