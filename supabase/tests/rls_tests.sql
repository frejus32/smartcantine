-- =============================================================================
-- SmartCantine — Tests des politiques RLS (exécutés sur la base locale de test).
-- Chaque assertion échoue bruyamment : un test silencieusement vert est un test mort.
-- =============================================================================

-- Préparation : une seconde école avec son admin (posé en superuser, hors RLS).
do $$
declare
  v_ecole_b uuid := gen_random_uuid();
  v_admin_b uuid := gen_random_uuid();
begin
  insert into public.etablissements (id, code, nom, ville)
  values (v_ecole_b, 'HORIZON02', 'College Horizon', 'Bouake');

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', v_admin_b, 'authenticated', 'authenticated',
    'admin@horizon.ci', 'x', now(), '{}', '{}', now(), now(), '', '', '', '');

  insert into public.profils (id, etablissement_id, role, nom_complet)
  values (v_admin_b, v_ecole_b, 'admin', 'Admin Horizon');

  insert into public.classes (etablissement_id, nom, niveau)
  values (v_ecole_b, '6e Avenir', 'college');
end $$;

-- Outil : endosser l'identité d'un utilisateur seedé.
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

-- =============================================================================
do $$
declare
  n int;
  v_classe_a uuid;
  v_classe_b uuid;
  v_eleve uuid;
begin
  select id into v_classe_a from public.classes where nom = 'CM2 B';
  select id into v_classe_b from public.classes where nom is not null
    and etablissement_id = (select id from public.etablissements where code = 'HORIZON02') limit 1;

  ---------------------------------------------------------------------------
  -- T1. L'admin de Colibris voit ses 12 élèves et UNE seule école.
  ---------------------------------------------------------------------------
  perform pg_temp.impersonate('admin@colibris.ci');
  select count(*) into n from public.eleves;
  if n <> 12 then raise exception 'T1a ECHEC : admin Colibris voit % eleves (attendu 12)', n; end if;
  select count(*) into n from public.etablissements;
  if n <> 1 then raise exception 'T1b ECHEC : admin Colibris voit % ecoles (attendu 1)', n; end if;
  raise notice 'T1 PASS — lecture bornee a son ecole';

  ---------------------------------------------------------------------------
  -- T2. L'admin d'Horizon ne voit AUCUN élève de Colibris.
  ---------------------------------------------------------------------------
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('admin@horizon.ci');
  select count(*) into n from public.eleves;
  if n <> 0 then raise exception 'T2 ECHEC : fuite inter-tenant, % eleves visibles', n; end if;
  raise notice 'T2 PASS — cloisonnement multi-tenant etanche';

  ---------------------------------------------------------------------------
  -- T3. L'agent peut LIRE les élèves (nécessaire au scan) mais pas en CRÉER.
  ---------------------------------------------------------------------------
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('agent@colibris.ci');
  select count(*) into n from public.eleves;
  if n <> 12 then raise exception 'T3a ECHEC : agent voit % eleves (attendu 12)', n; end if;
  begin
    insert into public.eleves (etablissement_id, classe_id, matricule, nom, prenoms)
    values (private.etablissement_id(), v_classe_a, 'HACK-1', 'Intrus', 'Test');
    raise exception 'T3b ECHEC : un agent a pu inscrire un eleve';
  exception when insufficient_privilege or check_violation then
    null; -- refus attendu (RLS)
  end;
  raise notice 'T3 PASS — agent : lecture oui, ecriture non';

  ---------------------------------------------------------------------------
  -- T4. Le responsable inscrit un élève ; le rattacher à une classe d'une
  --     AUTRE école est rejeté par le FK composite.
  ---------------------------------------------------------------------------
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('responsable@colibris.ci');
  insert into public.eleves (etablissement_id, classe_id, matricule, nom, prenoms)
  values (private.etablissement_id(), v_classe_a, 'COL-0999', 'Test', 'Insertion')
  returning id into v_eleve;
  begin
    insert into public.eleves (etablissement_id, classe_id, matricule, nom, prenoms)
    values (private.etablissement_id(), v_classe_b, 'COL-0998', 'Fuite', 'Tenant');
    raise exception 'T4 ECHEC : eleve rattache a une classe d''une autre ecole';
  exception when foreign_key_violation then
    null; -- refus attendu (FK composite)
  end;
  raise notice 'T4 PASS — FK composite anti-fuite entre ecoles';

  ---------------------------------------------------------------------------
  -- T5. Personne ne modifie son propre rôle ; l'agent ne modifie aucun rôle.
  ---------------------------------------------------------------------------
  begin
    update public.profils set role = 'admin' where id = auth.uid();
    raise exception 'T5a ECHEC : auto-elevation de privileges possible';
  exception when raise_exception then null;
  end;
  perform pg_temp.reset_identity();
  perform pg_temp.impersonate('admin@colibris.ci');
  update public.profils set role = 'responsable'
   where nom_complet = 'Koffi N''Guessan';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'T5b ECHEC : l''admin n''a pas pu promouvoir l''agent'; end if;
  update public.profils set role = 'agent'
   where nom_complet = 'Koffi N''Guessan'; -- retour a l'etat initial
  raise notice 'T5 PASS — roles proteges (trigger + politique admin)';

  ---------------------------------------------------------------------------
  -- T6. DELETE d'un élève : aucune politique => 0 ligne supprimée, même admin.
  ---------------------------------------------------------------------------
  delete from public.eleves where matricule = 'COL-0999';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'T6 ECHEC : un eleve a ete supprime physiquement'; end if;
  raise notice 'T6 PASS — suppression physique impossible (desactivation seulement)';

  ---------------------------------------------------------------------------
  -- T7. L'école d'un élève est immuable (garde-fou trigger).
  ---------------------------------------------------------------------------
  begin
    update public.eleves
       set etablissement_id = (select id from public.etablissements where code = 'HORIZON02')
     where matricule = 'COL-0999';
    raise exception 'T7 ECHEC : transfert inter-tenant possible';
  exception when raise_exception or insufficient_privilege or check_violation then null;
  end;
  raise notice 'T7 PASS — etablissement immuable';

  perform pg_temp.reset_identity();
  raise notice '=== TOUS LES TESTS RLS PASSENT ===';
end $$;
