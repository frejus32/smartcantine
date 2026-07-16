/**
 * Machine à états du poste de scan — Sprint 3B.
 * Pure : aucun effet de bord, uniquement (état, événement) -> état.
 * Toute transition absente de la table est ignorée (l'état ne change pas) :
 * un événement tardif (verdict après arrêt, détection pendant un verdict…)
 * ne peut jamais corrompre le poste.
 */

export const ETATS_SCANNER = [
  "idle",
  "camera_initializing",
  "camera_ready",
  "scanning",
  "processing",
  "authorized",
  "denied",
  "warning",
  "error",
  "returning",
] as const;

export type EtatScanner = (typeof ETATS_SCANNER)[number];

export type EvenementScanner =
  | { type: "DEMARRER" }
  | { type: "CAMERA_PRETE" }
  | { type: "CAMERA_ECHEC" }
  | { type: "SCAN_ACTIF" } // adaptateur attaché, détection en cours
  | { type: "DETECTION" } // un QR vient d'être lu
  | { type: "VERDICT_VERT" }
  | { type: "VERDICT_ORANGE" }
  | { type: "VERDICT_ROUGE" } // refus moteur OU badge invalide/falsifié
  | { type: "ECHEC_TECHNIQUE" } // moteur injoignable, réponse hors contrat…
  | { type: "TEMPORISATION_FINIE" } // fin d'affichage du verdict
  | { type: "RETOUR_FINI" } // fondu de retour terminé
  | { type: "REESSAYER" }
  | { type: "ARRETER" };

type TypeEvenement = EvenementScanner["type"];

/** Table de transitions — exhaustive et explicite. */
const TRANSITIONS: Record<EtatScanner, Partial<Record<TypeEvenement, EtatScanner>>> = {
  idle: {
    DEMARRER: "camera_initializing",
  },
  camera_initializing: {
    CAMERA_PRETE: "camera_ready",
    CAMERA_ECHEC: "error",
    ARRETER: "idle",
  },
  camera_ready: {
    SCAN_ACTIF: "scanning",
    CAMERA_ECHEC: "error",
    ARRETER: "idle",
  },
  scanning: {
    DETECTION: "processing",
    CAMERA_ECHEC: "error",
    ARRETER: "idle",
  },
  processing: {
    VERDICT_VERT: "authorized",
    VERDICT_ORANGE: "warning",
    VERDICT_ROUGE: "denied",
    ECHEC_TECHNIQUE: "error",
    ARRETER: "idle",
  },
  authorized: {
    TEMPORISATION_FINIE: "returning",
    ARRETER: "idle",
  },
  warning: {
    TEMPORISATION_FINIE: "returning",
    ARRETER: "idle",
  },
  denied: {
    TEMPORISATION_FINIE: "returning",
    ARRETER: "idle",
  },
  returning: {
    RETOUR_FINI: "scanning",
    ARRETER: "idle",
  },
  error: {
    REESSAYER: "camera_initializing",
    TEMPORISATION_FINIE: "returning", // erreur technique passagère : on revient scanner
    ARRETER: "idle",
  },
};

export function transition(etat: EtatScanner, evenement: EvenementScanner): EtatScanner {
  return TRANSITIONS[etat][evenement.type] ?? etat;
}

/** Les états qui affichent un verdict pleine page. */
export function estEtatVerdict(etat: EtatScanner): boolean {
  return etat === "authorized" || etat === "denied" || etat === "warning";
}
