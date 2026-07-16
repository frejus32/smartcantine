import type { ScanVerdict } from "@/lib/scan/verdict";

/**
 * Résultat d'un scan côté poste. Le moteur reste la seule source de vérité
 * pour les décisions métier ; les erreurs de BADGE (format, signature) sont
 * détectées avant l'appel moteur et n'appartiennent pas au contrat ScanVerdict.
 */
export type ResultatScan =
  | { source: "moteur"; verdict: ScanVerdict }
  | { source: "badge"; code: "qr_invalide" | "signature_invalide"; message: string }
  | { source: "technique"; message: string };

export type EntreeHistorique = {
  id: string;
  heure: string;
  titre: string;
  detail: string;
  verdict: "vert" | "orange" | "rouge";
};
