# Guide de l'administrateur — SmartCantine

Ce guide s'adresse au responsable qui administre SmartCantine dans l'école
(direction, intendance). Il ne suppose aucune compétence technique.

## Rôles

SmartCantine distingue trois rôles :

| Rôle                 | Peut faire                                                       |
| -------------------- | ---------------------------------------------------------------- |
| **Administrateur**   | Tout : élèves, badges, rapports, paramètres, utilisateurs, audit |
| **Responsable**      | Élèves, badges, rapports, calendrier                             |
| **Agent de cantine** | Scanner les badges au service (voir `CANTEEN_AGENT_GUIDE.md`)    |

## Premier démarrage

À la toute première utilisation, votre prestataire technique crée l'établissement
et votre compte administrateur. Vous recevez un identifiant (email) et un mot de
passe à changer.

## Créer les classes

Avant d'inscrire des élèves, créez les classes de l'école.
**Élèves → Inscrire un élève** propose la liste des classes ; si une classe manque,
créez-la d'abord (une classe se crée à la première inscription ou via l'import).

## Inscrire les élèves

Deux méthodes :

### Inscription individuelle

**Élèves → Inscrire un élève.** Renseignez nom, prénoms, matricule, classe. La
photo est facultative mais **recommandée** : elle s'affiche au scan et permet à
l'agent de vérifier que le badge correspond bien à l'enfant.

> La photo nécessite le **consentement parental** (case à cocher). C'est une
> obligation légale (loi ivoirienne 2013-450 sur les données personnelles).

### Import Excel (inscription en masse)

**Élèves → Importer Excel.**

1. Téléchargez le modèle Excel proposé.
2. Remplissez une ligne par élève : `matricule`, `nom`, `prenoms`, `classe`.
   Le nom de classe doit correspondre exactement à une classe existante.
3. Déposez le fichier. SmartCantine affiche un aperçu :
   - **Valides** : seront importés.
   - **Doublons** : matricule déjà présent (dans la base ou en double dans le
     fichier) — ignorés.
   - **Erreurs** : champ manquant ou classe introuvable — ignorés.
4. Cliquez sur « Importer ».

## Générer et imprimer les badges

**Badges.** Choisissez une classe (ou « Toute l'école »), cliquez sur
« Générer les badges », vérifiez l'aperçu, puis « Imprimer ». Choisissez le format
**A4** dans la boîte d'impression du navigateur. Plastifiez les badges pour la
durabilité.

Chaque badge porte le logo de l'école, la photo, le nom, la classe, le matricule
et un QR **signé** (infalsifiable).

## Créditer les repas

Le solde de repas d'un élève correspond à son droit au repas (ticket
dématérialisé). Selon votre organisation, le crédit se fait :

- **par mois** : le quota est calculé automatiquement d'après le calendrier
  scolaire (jours ouvrés, hors fériés et vacances) ;
- **par carnet** : un nombre fixe de repas.

Le crédit s'effectue depuis le banc d'essai (administrateur) ou via la procédure
définie avec votre prestataire. Tout ajustement manuel est **tracé au journal
d'audit**.

## Tableau de bord

Le tableau de bord affiche en temps réel : repas servis du jour, élèves inscrits,
quota total restant, et des **alertes** actionnables :

- **Dettes** : élèves au solde négatif (servis malgré un solde épuisé).
- **Soldes épuisés** : à recréditer.
- **Photos manquantes** : à compléter pour sécuriser le contrôle visuel.

## Rapports

**Rapports.** Deux vues :

- **Quotidien** : élèves servis, absents, repas distribués, régularisations, pour
  une date donnée, avec répartition par classe.
- **Mensuel** : consommation totale, moyenne par jour, sur un mois donné.

Chaque rapport s'exporte en **PDF**, **Excel** ou **CSV** (bouton en haut).

## Paramètres

**Paramètres** regroupe l'administration :

- **Établissement** : nom, logo, adresse, contacts (affichés sur badges/rapports).
- **Cantine** : heure du service, politique de dette (bloquer ou servir avec dette
  tracée), réinitialisation automatique du quota mensuel.
- **Calendrier** : ajout des jours fériés, vacances et fermetures. Ces jours sont
  **déduits automatiquement** des quotas mensuels.
- **Utilisateurs** : consulter les comptes et modifier leur rôle.
- **Sécurité** : consulter le **journal d'audit** (toutes les actions sensibles).

## Politique de dette

Deux modes, réglables dans **Paramètres → Cantine** :

- **Servir avec dette tracée** (par défaut) : un élève au solde épuisé est quand
  même servi, mais son solde passe en négatif (verdict orange « à régulariser »).
- **Blocage strict** : un élève au solde épuisé est refusé (verdict orange, non
  servi) et orienté vers l'intendance.

## Bonnes pratiques

- Complétez les photos : c'est la protection contre l'usurpation de badge.
- Tenez le calendrier à jour pour des quotas justes.
- Consultez le journal d'audit régulièrement.
- Limitez le nombre d'administrateurs ; la plupart des agents n'ont besoin que du
  rôle « agent ».
