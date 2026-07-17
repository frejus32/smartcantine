# Déploiement en production — SmartCantine

Déploiement sur **Vercel** (frontend Next.js) + **Supabase** (base, auth, stockage).

## Vue d'ensemble

```
Navigateur ──HTTPS──> Vercel (Next.js) ──> Supabase (PostgreSQL + Auth + Storage)
   (poste de scan)         (SSR + API)         (RLS, fonctions métier)
```

## 1. Préparer le projet Supabase de production

1. Créez un projet Supabase dédié à la production (distinct du développement).
2. Appliquez les migrations :
   ```bash
   supabase link --project-ref <ref-prod>
   supabase db push
   ```
3. **Ne chargez pas** `seed.sql` en production (données de démonstration).
4. Créez le premier établissement et le compte administrateur (voir
   `docs/ADMIN_GUIDE.md` § Premier démarrage).
5. Vérifiez que les buckets de stockage existent : `photos-eleves` (privé) et
   `logos-etablissements` (public). Ils sont créés par les migrations.

## 2. Générer les clés de production

```bash
node scripts/qr-keygen.mjs
```

Conservez la clé privée dans un gestionnaire de secrets. **Ne réutilisez pas**
les clés de développement : des badges signés avec une autre clé seraient rejetés.

## 3. Déployer sur Vercel

1. Importez le dépôt Git dans Vercel (framework détecté : Next.js).
2. Renseignez les variables d'environnement (Settings → Environment Variables) :

   | Variable                        | Valeur               | Portée              |
   | ------------------------------- | -------------------- | ------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | URL du projet prod   | Production          |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anon prod        | Production          |
   | `QR_SIGNING_PRIVATE_KEY`        | clé privée générée   | Production (secret) |
   | `NEXT_PUBLIC_QR_PUBLIC_KEY`     | clé publique générée | Production          |
   | `NEXT_PUBLIC_DEMO_MODE`         | `false`              | Production          |

3. Lancez le déploiement. Vercel exécute `npm run build`.

## 4. Configurer Supabase Auth

- **URL Configuration** → Site URL : l'URL Vercel de production.
- Ajoutez l'URL dans les **Redirect URLs** autorisées.
- Désactivez l'inscription publique si seuls les comptes créés par un
  administrateur doivent exister (Auth → Providers → Email → « Enable signups »).

## 5. Checklist de mise en production

Avant d'ouvrir l'accès à l'école :

- [ ] Migrations appliquées sur la base de production (`supabase db push`).
- [ ] `seed.sql` **non** chargé en production.
- [ ] Établissement et compte administrateur créés.
- [ ] Clés QR de production générées et stockées comme secrets.
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` en production.
- [ ] Toutes les variables d'environnement renseignées sur Vercel.
- [ ] Site servi en **HTTPS** (obligatoire pour la caméra du scanner).
- [ ] Site URL et Redirect URLs configurées dans Supabase Auth.
- [ ] Inscription publique désactivée si non souhaitée.
- [ ] En-têtes de sécurité vérifiés (voir ci-dessous).
- [ ] Politique de sauvegarde Supabase activée (voir `docs/BACKUP.md`).
- [ ] Parcours de validation complet effectué (voir § 6).
- [ ] Un agent de cantine a testé un scan réel sur le matériel cible.

## 6. Parcours de validation post-déploiement

Sur l'environnement de production, avec un compte administrateur :

1. Connexion.
2. Création d'une classe.
3. Import Excel d'élèves (ou création manuelle).
4. Upload d'une photo d'élève.
5. Génération et impression d'un badge.
6. Scan du badge → verdict « SERVIR », quota décrémenté.
7. Second scan le même jour → « REFUSER » (déjà servi).
8. Consultation du tableau de bord (repas servis à jour).
9. Rapport quotidien + export PDF.
10. Vérification du journal d'audit (l'action de création apparaît).

## 7. Vérifier les en-têtes de sécurité

```bash
curl -sI https://<votre-domaine> | grep -iE "x-frame|x-content|strict-transport|permissions-policy"
```

Attendu : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Strict-Transport-Security`, `Permissions-Policy: camera=(self), ...`.

## Procédures d'exploitation

- Sauvegarde et restauration : `docs/BACKUP.md`
- Mise à jour applicative : `docs/UPDATE.md`
