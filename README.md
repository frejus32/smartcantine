# SmartCantine

La cantine scolaire sans tickets papier — un badge QR par élève, un repas par jour, garanti même hors-ligne.

## Fonctionnalités

Application complète, prête pour un pilote en école réelle :

- **Élèves & classes** — CRUD complet, recherche, filtres, photos (Storage privé).
- **Import Excel** — inscription en masse avec détection des doublons et validation
  ligne à ligne, modèle téléchargeable.
- **Badges QR** — génération de QR **signés Ed25519** (par classe ou toute l'école),
  badges officiels (logo, photo, nom, classe, matricule), impression planche A4.
- **Scanner** — poste de scan temps réel : caméra, vérification de signature,
  verdict plein écran (servir / à régulariser / refuser), son, historique.
  Machine à états ; aucune règle métier côté client.
- **Dashboard** — repas servis, élèves inscrits, quota total restant, alertes
  actionnables (dettes, soldes épuisés, photos manquantes), activité récente.
- **Rapports** — quotidiens (servis, absents, distribués, régularisations) et
  mensuels (consommation, moyenne), graphiques réels, export **PDF / Excel / CSV**.
- **Paramètres** — établissement (identité, logo, contacts), cantine (heure de
  service, politique de dette, réinitialisation auto), calendrier scolaire
  (jours fériés / vacances / fermetures), utilisateurs & rôles, **journal d'audit**.

Le moteur métier PostgreSQL (fonctions `SECURITY DEFINER`) reste l'unique source
de vérité : toute écriture passe par lui, jamais par un `INSERT`/`UPDATE` direct.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner les clés Supabase (Dashboard > Settings > API)
npm run dev
```

## Scripts

| Commande            | Rôle                                    |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Serveur de développement (Turbopack)     |
| `npm run build`     | Build de production                      |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | Vérification TypeScript stricte          |
| `npm run format`    | Prettier sur tout le projet              |

## Rôles

Le rôle vit dans `app_metadata.role` du user Supabase : `admin`, `responsable` ou `agent`
(défaut : `agent`). À définir via le Dashboard Supabase ou l'API admin — jamais modifiable
par l'utilisateur lui-même.

## Conventions

- Commits : [Conventional Commits](https://www.conventionalcommits.org) — vérifiés par commitlint (hook `commit-msg`).
- Branches : `main` (production) ← `develop` ← `feat/…`, `fix/…`, `chore/…`.
- Pré-commit : ESLint + Prettier via lint-staged (hook `pre-commit`).

## Structure

```
src/
  app/            Routes (App Router) — (auth) public, (app) protégé
  components/     ui/ (shadcn), layout/, shared/
  features/       Logique métier par domaine (auth, students, scanner…)
  config/         env (validé Zod), routes, site
  lib/            utils, clients Supabase (client / server / middleware)
  services/       Appels de données typés
  hooks/ providers/ styles/ types/ utils/
```

## Tests

| Suite | Commande | Couverture |
| ----- | -------- | ---------- |
| Unitaires | `npm run test:unit` | Machine à états du scanner, badge signé Ed25519 (9 tests) |
| E2E scanner | `tests/e2e/scanner.e2e.py` (Playwright) | 7 scénarios de scan (13 assertions) |
| SQL RLS | `supabase/tests/rls_tests.sql` | Cloisonnement multi-tenant, rôles, append-only (7) |
| SQL métier | `supabase/tests/business_core_tests.sql` | Quotas, verdicts, concurrence (13) |
| SQL opérations | `supabase/tests/operations_tests.sql` | Rapports, audit, utilisateurs, calendrier (8) |

Les tests SQL se lancent sur une base PostgreSQL fraîche après application des
migrations (`supabase/migrations/`) et du seed (`supabase/seed.sql`).

## Architecture

- **Frontend** : Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4.
- **Backend** : Supabase (Auth, PostgreSQL, Storage). Toute la logique métier vit
  dans des fonctions PostgreSQL `SECURITY DEFINER` ; le front n'appelle que des RPC.
- **Sécurité** : RLS multi-tenant sur chaque table ; rôle dans `app_metadata`
  (anti-élévation) ; grand livre et journal d'audit en insertion seule (inviolables).
- **Badges** : QR signés Ed25519 — clé privée serveur, clé publique embarquée pour
  vérification hors-ligne. Format `SC1:<schoolId>:<studentId>:<signature>`.
- **Scanner** : machine à états pure + adaptateurs (BarcodeDetector natif, ZXing
  pour Safari/iPhone) ; le verdict provient exclusivement du moteur (`ScanVerdict`).
