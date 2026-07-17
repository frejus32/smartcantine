/**
 * Journalisation centralisée et structurée.
 * En production, ces logs sont captés par la plateforme (Vercel) et
 * consultables dans son tableau de bord. On ne journalise jamais de secret
 * ni de donnée personnelle (nom d'élève, photo) — uniquement des identifiants
 * techniques et des codes d'erreur.
 */

type Niveau = "info" | "warn" | "error";

type Contexte = Record<string, string | number | boolean | null | undefined>;

function emettre(niveau: Niveau, message: string, contexte?: Contexte) {
  const ligne = {
    ts: new Date().toISOString(),
    niveau,
    message,
    ...contexte,
  };
  const sortie = niveau === "error" ? console.error : console.log;
  sortie(JSON.stringify(ligne));
}

export const logger = {
  info: (message: string, contexte?: Contexte) => emettre("info", message, contexte),
  warn: (message: string, contexte?: Contexte) => emettre("warn", message, contexte),
  error: (message: string, contexte?: Contexte) => emettre("error", message, contexte),
};
