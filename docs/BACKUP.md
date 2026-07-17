# Sauvegarde et restauration — SmartCantine

Les données de SmartCantine vivent dans Supabase (PostgreSQL + Storage). Ce
document décrit comment les sauvegarder et les restaurer.

## Ce qu'il faut sauvegarder

1. **La base de données PostgreSQL** — élèves, classes, passages, grand livre,
   journal d'audit, paramètres. C'est l'essentiel.
2. **Le stockage (Storage)** — photos des élèves (`photos-eleves`) et logos
   (`logos-etablissements`).
3. **Les secrets** — la paire de clés QR et les variables d'environnement, à
   conserver hors de la base dans un gestionnaire de secrets.

## Sauvegarde automatique (recommandé)

Supabase fournit des sauvegardes gérées :

- **Plans payants** : sauvegardes quotidiennes automatiques (Dashboard → Database
  → Backups), avec restauration en un clic. Activez-les et vérifiez la rétention.
- **Point-in-Time Recovery (PITR)** : disponible en option pour restaurer à un
  instant précis.

Activez au minimum les sauvegardes quotidiennes avant la mise en production.

## Sauvegarde manuelle de la base

Avec le CLI Supabase ou `pg_dump` (chaîne de connexion dans Dashboard → Database →
Connection string) :

```bash
# Sauvegarde complète (schéma + données)
pg_dump "postgresql://postgres:<mdp>@<hote>:5432/postgres" \
  --no-owner --no-privileges -Fc -f smartcantine_$(date +%Y%m%d).dump
```

Stockez le fichier `.dump` dans un emplacement sûr et distinct (autre compte,
autre support). Conservez plusieurs générations (par exemple 7 jours + 4 semaines).

## Sauvegarde du stockage (photos, logos)

Les fichiers du Storage se téléchargent via l'API ou le Dashboard. Pour un export
scripté, listez et téléchargez les objets des buckets `photos-eleves` et
`logos-etablissements` (SDK Supabase ou `supabase storage` selon la version du CLI).

Comme les photos sont reconstituables (on peut reprendre les élèves en photo), la
base reste la priorité absolue.

## Restauration de la base

```bash
# Restauration dans un projet Supabase (ou une base vide)
pg_restore --no-owner --no-privileges --clean --if-exists \
  -d "postgresql://postgres:<mdp>@<hote>:5432/postgres" \
  smartcantine_20260717.dump
```

Après restauration :

1. Vérifiez que les tables sont peuplées (élèves, passages).
2. Vérifiez que l'application se connecte et affiche les données.
3. Vérifiez qu'un scan fonctionne (les clés QR n'ont pas changé).

> Avec les sauvegardes gérées Supabase, préférez la restauration en un clic depuis
> le Dashboard (Database → Backups → Restore).

## Restauration du stockage

Re-téléversez les fichiers dans les buckets d'origine en respectant les chemins
(`{etablissement_id}/{eleve_id}.jpg` pour les photos). Si les photos sont perdues,
l'application reste fonctionnelle : les élèves apparaissent sans photo (alerte
« photo manquante »), à recompléter.

## Test de restauration

Une sauvegarde non testée n'est pas une sauvegarde. **Au moins une fois avant la
mise en production**, restaurez le dernier `.dump` dans un projet Supabase de test
et déroulez le parcours de validation (`docs/DEPLOYMENT.md` § 6).

## Que faire en cas d'incident

1. Ne paniquez pas : le grand livre et le journal d'audit sont en **insertion
   seule**, les données ne sont jamais écrasées silencieusement.
2. Identifiez la nature de l'incident (perte de données, corruption, erreur
   humaine).
3. Restaurez la sauvegarde la plus récente antérieure à l'incident.
4. Communiquez à l'école la période éventuellement affectée.
