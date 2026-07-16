import { z } from "zod";

/**
 * CONTRAT UNIQUE ScanVerdict — Sprint 3.5.
 * Toute interface (banc d'essai, scanner web, mobile, API) consomme le verdict
 * du moteur PostgreSQL à travers CE module, et uniquement lui.
 * La forme est celle retournée par public.enregistrer_passage().
 */

export const scanVerdictSchema = z.object({
  verdict: z.enum(["vert", "orange", "rouge"]),
  code: z.enum([
    "servi",
    "a_regulariser",
    "solde_epuise_bloque",
    "deja_servi",
    "eleve_inconnu",
    "eleve_desactive",
  ]),
  eleve: z.string().optional(),
  classe_id: z.string().uuid().optional(),
  passage_id: z.string().uuid().optional(),
  solde: z.number().int().optional(),
  heure_premier_passage: z.string().optional(),
  photo_path: z.string().optional(),
});

export type ScanVerdict = z.infer<typeof scanVerdictSchema>;

export class ScanVerdictError extends Error {
  constructor(cause: unknown) {
    super("Réponse du moteur invalide : le contrat ScanVerdict n'est pas respecté.");
    this.name = "ScanVerdictError";
    this.cause = cause;
  }
}

/** Point d'entrée unique : valide la réponse brute du moteur. */
export function parseScanVerdict(data: unknown): ScanVerdict {
  const result = scanVerdictSchema.safeParse(data);
  if (!result.success) throw new ScanVerdictError(result.error);
  return result.data;
}

/** Rendu : un verdict = un mot, une couleur (Design System, couleurs sacrées). */
export const VERDICT_META = {
  vert: { mot: "SERVIR", badge: "Servi", fond: "bg-success" },
  orange: { mot: "À RÉGULARISER", badge: "À régulariser", fond: "bg-warning" },
  rouge: { mot: "REFUSER", badge: "Refusé", fond: "bg-destructive" },
} as const satisfies Record<ScanVerdict["verdict"], { mot: string; badge: string; fond: string }>;

/** Phrase de détail affichée sous le verdict, dérivée du code moteur. */
export function detailVerdict(v: ScanVerdict): string {
  switch (v.code) {
    case "servi":
      return `Solde restant : ${v.solde ?? "—"} repas`;
    case "a_regulariser":
      return `Solde épuisé — repas servi avec dette (solde : ${v.solde ?? "—"})`;
    case "solde_epuise_bloque":
      return "Solde épuisé — orienter l'élève vers l'économat";
    case "deja_servi":
      return `Déjà servi à ${v.heure_premier_passage ?? "—"}`;
    case "eleve_inconnu":
      return "Badge inconnu dans cet établissement";
    case "eleve_desactive":
      return "Élève désactivé — badge à récupérer";
  }
}
