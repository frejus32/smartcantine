# SmartCantine

La cantine scolaire sans tickets papier — un badge QR par élève, un repas par jour, garanti même hors-ligne.

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
