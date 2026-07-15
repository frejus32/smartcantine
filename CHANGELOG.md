# Changelog — SmartCantine

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnement par sprint.
Chaque entrée liste les nouveaux fichiers, les fichiers modifiés, les migrations et les commandes.

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
