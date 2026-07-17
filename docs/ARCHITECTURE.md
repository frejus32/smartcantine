# Architecture — SmartCantine

Document de référence technique. Pour l'usage fonctionnel, voir les guides
administrateur et agent de cantine.

## Principe directeur

**Le moteur métier PostgreSQL est l'unique source de vérité.** Toute décision
(servir ou non, calcul du quota, ajustement de solde) est prise par des fonctions
PostgreSQL `SECURITY DEFINER`. Le frontend n'appelle que ces fonctions (RPC) et
n'implémente **aucune** règle métier. Cette contrainte garantit que la même règle
s'applique quelle que soit l'interface (web, futur mobile, API).

## Pile technique

| Couche        | Technologie                                             |
| ------------- | ------------------------------------------------------- |
| Frontend      | Next.js 15 (App Router), React 19, TypeScript strict    |
| Styles        | Tailwind CSS v4, composants type shadcn/ui              |
| Backend       | Supabase : PostgreSQL, Auth, Storage                    |
| Hébergement   | Vercel (frontend + routes API), Supabase (données)      |
| Cryptographie | Ed25519 (`@noble/ed25519`) pour la signature des badges |

## Structure du code

```
src/
  app/              Routes (App Router)
    (auth)/         Routes publiques (login)
    (app)/          Routes protégées (dashboard, students, scanner, …)
    api/            Routes serveur (badge, badges, photo)
  components/       ui/ (primitives), layout/, shared/
  features/         Un dossier par domaine fonctionnel
  scanner/          Poste de scan : machine à états, adaptateurs, services
  services/         Ponts vers Supabase (lecture + RPC métier)
  lib/              qr/ (payload, signature, badge), scan/ (contrat), supabase/
  config/           env, routes, site
  types/            database, entities, auth
supabase/
  migrations/       Schéma versionné (17 fichiers)
  tests/            Tests SQL (RLS, métier, opérations)
  seed.sql          Jeu de démonstration
```

## Sécurité multi-tenant (RLS)

- Chaque table porte un `etablissement_id` et une **Row Level Security** qui borne
  l'accès à l'établissement de l'utilisateur connecté.
- Le **rôle** vit dans `app_metadata.role` du compte Supabase (et non dans une
  table modifiable), pour empêcher toute élévation de privilège. Un trigger
  synchronise le rôle vers le JWT.
- Les fonctions métier vérifient le rôle et **forcent** l'établissement au tenant
  de l'appelant : impossible d'écrire dans un autre établissement.
- Clés composites `(classe_id, etablissement_id)` empêchant les fuites inter-écoles.

## Intégrité des données

- **Grand livre** (`mouvements_repas`) et **journal d'audit** (`journal_audit`)
  sont en **insertion seule** : des triggers rejettent tout UPDATE/DELETE, même
  par le rôle de service. Le solde d'un élève est la somme de ses mouvements.
- **Règle d'or** : un index unique partiel garantit _un élève = un repas par jour_
  (`passages` sur `(eleve_id, date_service, type_service)` hors annulations).
- Les annulations sont des **contre-écritures** (+1), jamais des suppressions.

## Le contrat ScanVerdict

Le verdict d'un scan a une forme unique (`src/lib/scan/verdict.ts`), validée par
Zod. `enregistrer_passage()` retourne toujours un verdict (`vert`/`orange`/`rouge`)
et jamais une exception métier. Toutes les interfaces consomment ce contrat.

## Le poste de scan

- **Machine à états pure** (`src/scanner/types/machine.ts`) : transitions
  explicites, événements hors table ignorés (robustesse aux événements tardifs).
- **Adaptateurs de détection** interchangeables : `BarcodeDetector` natif
  (Chrome/Edge/Android), repli `ZXing` (Safari/iPhone, chargé à la demande),
  adaptateur de test (E2E).
- **Pipeline** : QR → validation format v1 → vérification signature Ed25519 →
  `enregistrer_passage()` → `ScanVerdict`. Aucune règle métier côté client.

## Badges signés

Format imprimé : `SC1:<schoolId>:<studentId>:<signature-ed25519>`. La signature est
produite **côté serveur** (clé privée jamais exposée) et vérifiée au scan avec la
clé publique (embarquée). Un badge modifié ou signé avec une autre clé est rejeté.
La vérification fonctionne **hors-ligne** (pas d'appel réseau pour valider la
signature), ce qui prépare le mode déconnecté.

## Performance

- **Bundles** allégés par chargement à la demande : jsPDF, xlsx, recharts et ZXing
  ne sont chargés qu'au moment où ils servent (export, import, graphiques, Safari).
- **Requêtes** : index sur tous les chemins chauds (RLS, recherche, rapports,
  calcul de solde). Les listes sont paginées côté client (jamais de chargement
  massif). Les agrégations du tableau de bord et des rapports sont calculées en
  base (une seule requête RPC), pas côté client.

## Observabilité

- Journalisation serveur structurée (`src/lib/logger.ts`) sur les routes API,
  captée par la plateforme d'hébergement. Aucune donnée personnelle ni secret dans
  les logs.
- Journal d'audit applicatif (`journal_audit`) pour les actions sensibles :
  ajustements de solde, changements de rôle, modifications de paramètres,
  calendrier. Inviolable et consultable par les administrateurs.

## Tests

| Suite              | Portée                                             |
| ------------------ | -------------------------------------------------- |
| Unitaires (Vitest) | Machine à états, badge signé Ed25519               |
| E2E (Playwright)   | Poste de scan : 7 scénarios, 13 assertions         |
| SQL RLS            | Cloisonnement multi-tenant, rôles, insertion seule |
| SQL métier         | Quotas, verdicts, concurrence                      |
| SQL opérations     | Rapports, audit, utilisateurs, calendrier          |

## Limites connues

- **Mode hors-ligne** : la vérification de signature fonctionne déjà sans réseau,
  mais l'enregistrement d'un passage requiert la connexion à Supabase. Une file de
  synchronisation locale (IndexedDB) reste à implémenter pour un fonctionnement
  totalement déconnecté.
- **Calcul du solde** : effectué à la lecture (somme des mouvements). Efficace et
  indexé à l'échelle d'une école ; à surveiller pour de très gros volumes
  historiques (plusieurs années), où une colonne de solde matérialisé pourrait être
  envisagée.
