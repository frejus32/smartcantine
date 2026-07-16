# Changelog — SmartCantine

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnement par sprint.
Chaque entrée liste les nouveaux fichiers, les fichiers modifiés, les migrations et les commandes.

## [Sprint 3B — Scan Runtime] — 2026-07-16

### Ajouté — module `src/scanner/`
- `types/machine.ts` — machine à états pure (idle, camera_initializing, camera_ready,
  scanning, processing, authorized, denied, warning, error, returning) ; table de
  transitions explicite, événements hors table ignorés (anti-corruption).
- `types/resultat.ts` — `ResultatScan` (moteur | badge | technique), `EntreeHistorique`.
- `adapters/` — contrat `ScannerAdapter` + 3 implémentations : `BarcodeDetector`
  (Chrome/Edge/Android), `ZXing` (repli Safari/iPhone), `test` (couture E2E) ;
  `index.ts` sélectionne automatiquement le meilleur disponible.
- `services/camera.service.ts` — ouverture de la meilleure caméra (arrière préférée),
  codes d'erreur stables (refusée / indisponible / erreur).
- `services/audio.service.ts` — AudioService Web Audio (success / warning / error),
  synthétisé, préparé au geste utilisateur.
- `services/scan-pipeline.ts` — pipeline étapes 4→8 : format v1 → signature Ed25519
  → studentId → `enregistrer_passage()` → `ScanVerdict`. Aucune décision métier.
- `hooks/use-scanner.ts` — orchestrateur : pilote la machine, exécute l'effet de
  chaque état (caméra, adaptateur, pipeline, son, temporisations, retour auto).
- `components/scan-screen.tsx` — poste réel : viseur caméra, verdict pleine page
  (photo, nom, classe, heure, solde, mot), plein écran postes fixes, historique.

### Ajouté — cryptographie & outils
- `src/lib/qr/signature.ts` — signature/vérification Ed25519 (@noble/ed25519).
- `src/lib/qr/badge.ts` — badge signé `SC1:<schoolId>:<studentId>:<signature>` ;
  `encoderBadge` (serveur) / `decoderBadge` (scan, rejette tout badge non authentique).
- `scripts/qr-keygen.mjs` — génération de la paire de clés (`node scripts/qr-keygen.mjs`).

### Ajouté — tests
- Unitaires (Vitest) : `machine.test.ts` (5), `badge.test.ts` (4) — **9/9**.
- E2E (`tests/e2e/scanner.e2e.py`, Playwright) : QR valide, déjà servi, élève inactif,
  QR invalide, signature invalide, caméra refusée, caméra indisponible — **13/13**.

### Modifié
- `src/services/moteur.service.ts` — `listerClasses()` (libellés au verdict).
- `src/app/(app)/scanner/page.tsx` — branché sur `<ScanScreen />` (runtime réel).
- `src/config/env.ts` — `NEXT_PUBLIC_QR_PUBLIC_KEY` (clé publique de vérification).
- `.env.example` / `.env.local` — clés QR (privée serveur, publique client).

### Supprimé
- `src/features/scanner/scanner-demo.tsx` — maquette du Sprint UI, remplacée.

### Dépendances
- Ajout : `@noble/ed25519`, `@noble/hashes`, `@zxing/browser` ; dev : `vitest`.
- Scripts : `test:unit` (vitest run).

### Décisions
- Ed25519 via @noble (et non WebCrypto) pour un support homogène Safari/iOS.
- Aucune règle métier dans React : tout refus vient du moteur ; le pipeline ne
  rejette que les badges non authentiques (format / signature).

### Vérifications
- build vert, lint vert, typecheck vert ; unitaires 9/9 ; E2E scanner 13/13 ;
  non-régression SQL (RLS 7/7, métier 13/13).

## [Sprint 3.5 — Banc d'essai du moteur] — 2026-07-15

### Ajouté
- **Contrat unique `ScanVerdict`** (`src/lib/scan/verdict.ts`) : schéma Zod du verdict
  du moteur, `parseScanVerdict()` (validation stricte), `VERDICT_META` (mot / couleur),
  `detailVerdict()`. Toute interface future (scanner web, mobile, API) passe par lui.
- **Structure du QR Code v1** (`src/lib/qr/payload.ts`) : contenu minimal
  `version + schoolId + studentId` au format `SC1:<schoolId>:<studentId>` ;
  `encodeQrPayload()` / `decodeQrPayload()` validés Zod ; 4e segment réservé à la
  signature Ed25519 (Sprint 3B). Aucune donnée personnelle ni périmable dans le badge.
- **Service pont** (`src/services/moteur.service.ts`) : wrappers RPC des fonctions
  métier + lectures (élèves, passages, grand livre). Zéro logique métier côté client.
- **Page `/banc-essai`** (admin uniquement, entrée de navigation dédiée) :
  sélection d'élève, solde en direct, verdict rendu au contrat, historiques
  passages + grand livre, et 6 actions appelant exclusivement le moteur :
  simuler un passage, créditer carnet +5, créditer le mois (quota calendrier),
  passage daté d'hier, annuler le dernier passage, réinitialiser le solde à 0
  (contre-écriture). Bannière d'avertissement en mode démo.
- Migration `20260716100000_outils_banc_essai.sql` : `banc_essai_passage_veille()`
  — outil de test (admin + refusé si `app.environnement = 'production'`) prouvant
  que l'unicité du repas est bien PAR JOUR.
- Test T13 (métier) : le passage d'hier ne bloque pas aujourd'hui.

### Modifié
- `supabase/seed.sql` : année scolaire active 2025-2026 (couvre la date du jour,
  « Créditer le mois » fonctionne avec prorata réel) + 1 jour férié de démonstration.
- `supabase/tests/business_core_tests.sql` : fixture (année du seed désactivée) + T13.
- `src/types/database.ts` : signature `banc_essai_passage_veille` ; le contrat verdict
  déménage vers `lib/scan/verdict.ts` (source unique).
- `src/config/routes.ts`, `nav-links.tsx` : entrée « Banc d'essai » (admin).

### Vérifications
- SQL : 10 migrations + seed OK ; régression RLS 7/7 ; métier **13/13** ; concurrence OK.
- QR : aller-retour encode/décode + 5 payloads invalides rejetés.
- UI : 8/8 assertions Playwright (verdict vert puis rouge « déjà servi à 12:04 »,
  solde 5→4, historiques rafraîchis), moteur simulé par interception réseau.

## [Sprint 3A — Business Core] — 2026-07-15

### Ajouté — migrations (`supabase/migrations/`)
- `20260715100000_calendrier.sql` — `annees_scolaires` (bornes, jours d'ouverture ISO,
  une seule année active par école), `jours_exceptionnels` (férié / vacances / fermeture,
  bornés à leur année par trigger), fonctions `est_jour_ouvert()`,
  `private.compter_jours_ouverts()`, `quota_du_mois()`.
- `20260715110000_repas.sql` — `passages` avec **l'index unique partiel
  `(eleve_id, date_service, type_service) where statut <> 'annule'`** (la règle d'or),
  `mouvements_repas` (grand livre signé : crédits > 0, consommation = -1, ajustements
  motivés, un seul `credit_mois` par élève et par mois), triggers **append-only**
  (UPDATE/DELETE bloqués pour tous, service_role compris), garde d'annulation
  (transition unique, fenêtre 5 min), `solde_eleve()`, colonne
  `etablissements.politique_solde_epuise` (strict | dette).
- `20260715120000_fonctions_metier.sql` — fonctions SECURITY DEFINER, seul chemin
  d'écriture : `crediter_mois()` (quota auto + prorata + anti double-facturation),
  `crediter_carnet()`, `ajuster_solde()` (contre-écriture motivée, admin),
  `enregistrer_passage()` (verdicts vert/orange/rouge, course concurrente absorbée
  en rouge « déjà servi »), `annuler_passage()` (sous 5 min, contre-écriture +1).
- `20260715130000_rls_repas.sql` — RLS : lecture par école/rôle ; **aucune politique
  d'écriture** sur `mouvements_repas` ni `passages`.

### Ajouté — tests (`supabase/tests/`)
- `business_core_tests.sql` — 12 assertions : quota (18), week-ends/fériés/vacances/
  fermetures exclus, prorata (13), crédit et anti double-facturation, verdict vert,
  rouge « déjà servi » avec heure, orange dette (-1) et orange strict (0 passage),
  fraudes rejetées (rôles, RLS, append-only, falsification de date), annulation + re-scan.
- `concurrence_test.sh` — 8 connexions simultanées sur le même élève :
  1 vert / 7 rouges / 1 passage / solde -1.

### Modifié
- `src/types/database.ts` — nouvelles tables (Insert/Update `never` sur les journaux),
  signatures des 8 fonctions, type `VerdictScan` (contrat du scanner 3B), enums.
- `src/types/entities.ts` — alias `AnneeScolaire`, `JourExceptionnel`,
  `MouvementRepas`, `Passage`.

### Décisions
- Le calendrier gouverne les **quotas**, jamais le droit de servir un jour donné.
- Les cas métier du scan retournent un **verdict**, jamais une exception.

### Commandes
- Pipeline local : rebuild + 9 migrations + seed + `rls_tests.sql` (régression 7/7)
  + `business_core_tests.sql` (12/12) + `concurrence_test.sh` (OK).

## [Sprint UI] — 2026-07-14 — commit `eb9cac8`

### Ajouté
- **Mode démonstration** (`NEXT_PUBLIC_DEMO_MODE=true` dans `.env.local`) : navigation
  complète sans projet Supabase ; utilisateur fictif « Awa Yao » (admin).
- Données fictives centralisées : `src/lib/mock/data.ts` (24 élèves, 4 classes, scans, séries).
- Dashboard : `features/dashboard/{kpi-card,repas-chart,activite-recente}.tsx`, page + skeleton.
- Élèves : `features/students/students-table.tsx` (recherche, filtres, pagination,
  aperçu badge QR, dialogue d'inscription), page + skeleton.
- Scanner : `features/scanner/scanner-demo.tsx` (mode amplifié sombre, verdicts pleine page
  vert/rouge/orange, historique), page.
- Calendrier : `features/calendar/calendar-view.tsx` (3 mois 2026-2027, 5 statuts de jour,
  quota mensuel auto), page.
- Rapports : `features/reports/{reports-charts,export-buttons}.tsx`, page + skeleton.
- Paramètres : `features/settings/settings-form.tsx` (solde épuisé strict/dette, mercredi,
  équipe, zone sensible avec confirmation), page.
- Profil : `features/profile/profile-view.tsx`, page.
- Composants UI : `ui/native-select.tsx`, `ui/switch.tsx`.

### Modifié
- `src/config/env.ts` : flag `NEXT_PUBLIC_DEMO_MODE` (validé Zod).
- `src/lib/supabase/middleware.ts` : court-circuit en mode démo.
- `src/app/(app)/layout.tsx` : extraction `AppShell`, utilisateur fictif en démo,
  conteneur `max-w-6xl` + animation d'entrée.
- `src/styles/globals.css` : import `tw-animate-css` (corrige les animations de modales
  du Sprint 1, inertes car paquet manquant) + keyframe `enter-up`.

### Dépendances
- Ajout : `recharts`, `@radix-ui/react-switch`, `tw-animate-css`.

### Vérifications
- Build de production OK ; 13/13 assertions Playwright sur les 7 pages.

## [Sprint 2 — Base de données] — 2026-07-14 — commit `2e39135`

### Ajouté
- Migrations Supabase (`supabase/migrations/`) :
  1. `20260714100000_types_and_helpers.sql` — enums (`role_utilisateur`, `niveau_scolaire`,
     `statut_eleve`), schéma `private`, helpers RLS (`etablissement_id()`, `user_role()`,
     `is_service_role()`), trigger `set_updated_at`, grants.
  2. `20260714110000_tenants.sql` — `etablissements`, `profils`, synchro rôle → JWT
     (`app_metadata`), garde-fous (école immuable, rôles protégés, anti-auto-élévation).
  3. `20260714120000_classes_eleves.sql` — `classes`, `eleves`, **FK composite anti-fuite
     inter-écoles**, index de recherche, consentement photo daté.
  4. `20260714130000_rls_policies.sql` — RLS complet ; pas de DELETE sur `eleves`.
  5. `20260714140000_storage.sql` — bucket privé `photos-eleves` (1 Mo, JPEG/WebP),
     politiques par chemin `{etablissement_id}/…`.
- `supabase/seed.sql` — école Les Colibris, 3 comptes (`Password123!`), 3 classes, 12 élèves.
- Harnais de test : `supabase/tests/auth_stub_local.sql` (bouchon auth/storage pour
  PostgreSQL nu) + `supabase/tests/rls_tests.sql` (**7 assertions, toutes passantes**).
- Types : `src/types/database.ts` (format Supabase officiel), `src/types/entities.ts`.

### Modifié
- `src/lib/supabase/{client,server}.ts` : clients typés `<Database>`.
- `package.json` : scripts `db:types`, `db:test`.

### Commandes
- Réel : `supabase db reset` (migrations + seed). Local nu : voir `supabase/tests/`.

## [Sprint 1 — Fondations] — 2026-07-14 — commit `3356879`

### Ajouté
- Projet Next.js 15.5 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4.
- Qualité : ESLint (+ config Prettier), Prettier (+ plugin Tailwind), Husky,
  lint-staged, commitlint (Conventional Commits, scopes projet).
- Thème : jetons du Design System V1.0 dans `src/styles/globals.css`
  (Bleu Confiance `#1E5AA8`, palette sémantique réservée aux verdicts, chiffres tabulaires).
- Kit UI shadcn (15 composants) + `components.json` ; polices auto-hébergées
  `@fontsource-variable` Inter & Manrope.
- Layout : Sidebar desktop / Sheet mobile, Header (rôle + menu compte), Footer.
- Routes : `/login` + 7 pages protégées ; layouts `(auth)` / `(app)`.
- Auth Supabase : clients browser/server, middleware (session + garde par rôle,
  redirection `?next=`), service `auth.service.ts` ; rôle lu depuis `app_metadata`.
- Config : `env.ts` validé Zod, `routes.ts` (navigation + accès par rôle), `site.ts`.

### Commandes
- `npm install` puis `npm run dev` ; scripts `lint`, `typecheck`, `format`, `build`.
