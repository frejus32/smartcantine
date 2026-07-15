-- =============================================================================
-- SmartCantine — Données de démonstration (développement local uniquement).
-- `supabase db reset` exécute ce fichier après les migrations.
-- Comptes : admin@colibris.ci / responsable@colibris.ci / agent@colibris.ci
-- Mot de passe commun : Password123!
-- =============================================================================

do $$
declare
  v_ecole      uuid := gen_random_uuid();
  v_admin      uuid := gen_random_uuid();
  v_resp       uuid := gen_random_uuid();
  v_agent      uuid := gen_random_uuid();
  v_maternelle uuid := gen_random_uuid();
  v_cm2        uuid := gen_random_uuid();
  v_5e         uuid := gen_random_uuid();
  v_annee      uuid := gen_random_uuid();
  v_pwd        text := crypt('Password123!', gen_salt('bf'));
begin
  -- École de démonstration -------------------------------------------------
  insert into public.etablissements (id, code, nom, ville)
  values (v_ecole, 'COLIBRIS01', 'Groupe Scolaire Les Colibris', 'Abidjan');

  -- Utilisateurs auth + profils --------------------------------------------
  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
     raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
     confirmation_token, recovery_token, email_change, email_change_token_new)
  values
    ('00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
     'admin@colibris.ci', v_pwd, now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Awa Yao"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_resp, 'authenticated', 'authenticated',
     'responsable@colibris.ci', v_pwd, now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Adjoua Konan"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_agent, 'authenticated', 'authenticated',
     'agent@colibris.ci', v_pwd, now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Koffi N''Guessan"}', now(), now(), '', '', '', '');

  insert into auth.identities
    (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select u.id::text, u.id,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', now(), now(), now()
  from (values (v_admin), (v_resp), (v_agent)) as t(id)
  join auth.users u on u.id = t.id;

  insert into public.profils (id, etablissement_id, role, nom_complet) values
    (v_admin, v_ecole, 'admin',       'Awa Yao'),
    (v_resp,  v_ecole, 'responsable', 'Adjoua Konan'),
    (v_agent, v_ecole, 'agent',       'Koffi N''Guessan');

  -- Classes ------------------------------------------------------------------
  insert into public.classes (id, etablissement_id, nom, niveau) values
    (v_maternelle, v_ecole, 'Petite Section A', 'maternelle'),
    (v_cm2,        v_ecole, 'CM2 B',            'primaire'),
    (v_5e,         v_ecole, '5e Rubis',         'college');

  -- Année scolaire active (couvre la date du jour pour le banc d'essai) --------
  insert into public.annees_scolaires
    (id, etablissement_id, libelle, date_debut, date_fin, actif)
  values
    (v_annee, v_ecole, '2025-2026', '2025-09-01', '2026-07-31', true);

  insert into public.jours_exceptionnels
    (etablissement_id, annee_scolaire_id, jour, type, motif)
  values
    (v_ecole, v_annee, '2026-07-20', 'ferie', 'Journée pédagogique (démonstration)');

  -- Élèves (12) ---------------------------------------------------------------
  insert into public.eleves
    (etablissement_id, classe_id, matricule, nom, prenoms, date_naissance,
     consentement_photo, consentement_date)
  values
    (v_ecole, v_maternelle, 'COL-0001', 'Kouassi', 'Aya Grâce',     '2022-03-14', true,  now()),
    (v_ecole, v_maternelle, 'COL-0002', 'Diabaté', 'Moussa',        '2022-07-02', true,  now()),
    (v_ecole, v_maternelle, 'COL-0003', 'Koné',    'Fatoumata',     '2021-11-25', false, null),
    (v_ecole, v_cm2,        'COL-0101', 'Yao',     'Jean-Marc',     '2015-01-18', true,  now()),
    (v_ecole, v_cm2,        'COL-0102', 'Traoré',  'Aminata',       '2015-05-09', true,  now()),
    (v_ecole, v_cm2,        'COL-0103', 'N''Dri',  'Axel Emmanuel', '2014-12-30', true,  now()),
    (v_ecole, v_cm2,        'COL-0104', 'Bamba',   'Mariam',        '2015-08-21', true,  now()),
    (v_ecole, v_5e,         'COL-0201', 'Ouattara','Ibrahim',       '2012-02-11', true,  now()),
    (v_ecole, v_5e,         'COL-0202', 'Gnahoré', 'Marie-Ange',    '2012-06-27', true,  now()),
    (v_ecole, v_5e,         'COL-0203', 'Soro',    'Yaya',          '2011-10-05', true,  now()),
    (v_ecole, v_5e,         'COL-0204', 'Aka',     'Bénédicte',     '2012-04-16', true,  now()),
    (v_ecole, v_5e,         'COL-0205', 'Kouamé',  'Olivier',       '2012-09-08', false, null);
end $$;
