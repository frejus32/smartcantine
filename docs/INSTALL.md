# Installation — SmartCantine

Guide d'installation en environnement de développement local.

## Prérequis

- **Node.js** 20 ou supérieur (`node --version`)
- **npm** 10 ou supérieur
- Un projet **Supabase** (gratuit sur [supabase.com](https://supabase.com)) ou le
  **Supabase CLI** pour un environnement 100 % local

## 1. Récupérer le code et installer les dépendances

```bash
git clone <url-du-depot> smartcantine
cd smartcantine
npm install
```

## 2. Générer les clés de signature des badges

Les badges QR sont signés (Ed25519). Générez une paire de clés :

```bash
node scripts/qr-keygen.mjs
```

La commande affiche deux lignes (`QR_SIGNING_PRIVATE_KEY` et
`NEXT_PUBLIC_QR_PUBLIC_KEY`) à recopier dans `.env.local` à l'étape suivante.

> **Important** : la clé privée ne doit jamais être partagée ni committée. Elle
> sert uniquement, côté serveur, à signer les badges. La clé publique vérifie les
> badges au scan et peut être exposée sans risque.

## 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Renseignez `.env.local` :

| Variable                        | Où la trouver                                           |
| ------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API → Project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public                 |
| `QR_SIGNING_PRIVATE_KEY`        | Générée à l'étape 2                                     |
| `NEXT_PUBLIC_QR_PUBLIC_KEY`     | Générée à l'étape 2                                     |
| `NEXT_PUBLIC_DEMO_MODE`         | `false` pour une vraie base, `true` pour l'UI sans auth |

## 4. Appliquer le schéma de base de données

Avec le **Supabase CLI** (recommandé) :

```bash
supabase link --project-ref <votre-ref>
supabase db push          # applique supabase/migrations/
```

Puis chargez le jeu de démonstration (facultatif, pour tester) :

```bash
supabase db reset          # rejoue migrations + supabase/seed.sql
```

> Sans le CLI, ouvrez le **SQL Editor** de Supabase et exécutez dans l'ordre les
> fichiers de `supabase/migrations/`, puis `supabase/seed.sql`.

## 5. Lancer l'application

```bash
npm run dev
```

L'application est disponible sur <http://localhost:3000>.

Avec le jeu de démonstration, connectez-vous en `admin@colibris.ci` /
`Password123!`.

## Scripts utiles

| Commande            | Rôle                            |
| ------------------- | ------------------------------- |
| `npm run dev`       | Serveur de développement        |
| `npm run build`     | Build de production             |
| `npm run lint`      | ESLint                          |
| `npm run typecheck` | Vérification TypeScript stricte |
| `npm run test:unit` | Tests unitaires (Vitest)        |

## Dépannage

- **« Signature non configurée » à la génération d'un badge** : `QR_SIGNING_PRIVATE_KEY`
  est absente de `.env.local`. Régénérez avec `node scripts/qr-keygen.mjs`.
- **Page blanche / redirection vers /login en boucle** : vérifiez l'URL et la clé
  anon Supabase, et que les migrations sont bien appliquées (table `profils`).
- **La caméra ne démarre pas** : le navigateur exige HTTPS (ou `localhost`).
  En production, servez le site en HTTPS.
