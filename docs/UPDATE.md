# Procédure de mise à jour — SmartCantine

Comment déployer une nouvelle version de SmartCantine sans perte de données ni
interruption prolongée.

## Principes

- Le code et la base évoluent ensemble. Une mise à jour peut comporter de
  **nouvelles migrations** SQL (dans `supabase/migrations/`).
- Les migrations sont **additives et idempotentes** par convention : le grand
  livre et le journal d'audit ne sont jamais modifiés rétroactivement.
- On sauvegarde **avant** toute mise à jour touchant la base.

## Procédure standard

1. **Sauvegarder la base de production** (voir `docs/BACKUP.md`). Étape
   obligatoire s'il y a des migrations.

2. **Récupérer la nouvelle version** du code et vérifier le `CHANGELOG.md` pour
   repérer les migrations et changements notables.

3. **Appliquer les nouvelles migrations** sur la base de production :

   ```bash
   supabase link --project-ref <ref-prod>
   supabase db push
   ```

   `db push` n'applique que les migrations non encore jouées.

4. **Déployer le code** : poussez sur la branche suivie par Vercel (ou déclenchez
   un déploiement). Vercel build et met en ligne. Le déploiement est atomique :
   les utilisateurs basculent sur la nouvelle version sans coupure.

5. **Vérifier** : déroulez le parcours de validation (`docs/DEPLOYMENT.md` § 6) et
   contrôlez qu'un scan fonctionne.

## Ordre base / code

Les migrations de ce projet sont conçues pour être **rétro-compatibles** avec la
version de code précédente le temps du déploiement (ajout de colonnes/fonctions,
pas de suppression brutale). L'ordre recommandé est donc : **migrations d'abord,
puis code**. En cas de changement incompatible signalé dans le CHANGELOG, suivez
les instructions spécifiques de la version.

## Vérifier après mise à jour

- [ ] L'application se charge et la connexion fonctionne.
- [ ] Un scan aboutit à un verdict correct.
- [ ] Le tableau de bord affiche les chiffres du jour.
- [ ] Aucune erreur dans les logs Vercel (Runtime Logs).

## Revenir en arrière (rollback)

- **Code** : Vercel conserve les déploiements précédents. « Promote » l'ancien
  déploiement pour revenir instantanément à la version antérieure.
- **Base** : si une migration pose problème, restaurez la sauvegarde prise à
  l'étape 1. C'est pourquoi la sauvegarde préalable est obligatoire.

> Comme le code peut revenir en arrière instantanément mais pas la base, évitez les
> migrations destructrices. Ce projet n'en contient pas : les tables sensibles sont
> en insertion seule.

## Cadence conseillée

- Appliquez les correctifs de sécurité des dépendances régulièrement
  (`npm audit`).
- Testez chaque mise à jour sur un environnement de préproduction (un projet
  Supabase de test + un déploiement de prévisualisation Vercel) avant la
  production.
