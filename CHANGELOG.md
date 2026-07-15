# Changelog — SmartCantine

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnement par sprint.
Chaque entrée liste les nouveaux fichiers, les fichiers modifiés, les migrations et les commandes.

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
