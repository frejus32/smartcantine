import { createClient } from "@/lib/supabase/client";
import { parseScanVerdict, type ScanVerdict } from "@/lib/scan/verdict";
import type { MouvementRepas, Passage } from "@/types/entities";

/**
 * Pont unique vers le moteur métier PostgreSQL (fonctions SECURITY DEFINER).
 * AUCUNE règle métier ici : on appelle, on valide le contrat, on remonte.
 */

export type EleveResume = {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  statut: "actif" | "desactive";
};

function messageErreur(error: { message?: string } | null, fallback: string): string {
  return error?.message?.replace(/^.*?: /, "") || fallback;
}

export async function listerEleves(): Promise<EleveResume[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eleves")
    .select("id, matricule, nom, prenoms, statut")
    .order("matricule")
    .limit(100);
  if (error) throw new Error(messageErreur(error, "Impossible de charger les élèves."));
  return (data ?? []) as EleveResume[];
}

export type ClasseResume = { id: string; nom: string };

export async function listerClasses(): Promise<ClasseResume[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("classes").select("id, nom").order("nom");
  if (error) throw new Error(messageErreur(error, "Impossible de charger les classes."));
  return (data ?? []) as ClasseResume[];
}

export async function soldeEleve(eleveId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("solde_eleve", { p_eleve_id: eleveId });
  if (error) throw new Error(messageErreur(error, "Solde indisponible."));
  return data as number;
}

export async function enregistrerPassage(eleveId: string): Promise<ScanVerdict> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("enregistrer_passage", { p_eleve_id: eleveId });
  if (error) throw new Error(messageErreur(error, "Le moteur a refusé l'opération."));
  return parseScanVerdict(data);
}

export async function crediterCarnet(eleveId: string, quantite: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("crediter_carnet", {
    p_eleve_id: eleveId,
    p_quantite: quantite,
  });
  if (error) throw new Error(messageErreur(error, "Crédit refusé par le moteur."));
}

export async function crediterMoisCourant(eleveId: string): Promise<{ quota: number }> {
  const supabase = createClient();
  const maintenant = new Date();
  const { data, error } = await supabase.rpc("crediter_mois", {
    p_eleve_id: eleveId,
    p_annee: maintenant.getFullYear(),
    p_mois: maintenant.getMonth() + 1,
  });
  if (error) throw new Error(messageErreur(error, "Crédit du mois refusé par le moteur."));
  return data as { quota: number };
}

export async function ajusterSolde(
  eleveId: string,
  quantite: number,
  motif: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("ajuster_solde", {
    p_eleve_id: eleveId,
    p_quantite: quantite,
    p_motif: motif,
  });
  if (error) throw new Error(messageErreur(error, "Ajustement refusé par le moteur."));
}

export async function annulerPassage(passageId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("annuler_passage", { p_passage_id: passageId });
  if (error) throw new Error(messageErreur(error, "Annulation refusée par le moteur."));
}

export async function passageVeille(eleveId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("banc_essai_passage_veille", { p_eleve_id: eleveId });
  if (error) throw new Error(messageErreur(error, "Outil de test refusé par le moteur."));
}

export async function listerPassages(eleveId: string): Promise<Passage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("passages")
    .select("*")
    .eq("eleve_id", eleveId)
    .order("horodatage", { ascending: false })
    .limit(10);
  if (error) throw new Error(messageErreur(error, "Historique des passages indisponible."));
  return (data ?? []) as Passage[];
}

export async function listerMouvements(eleveId: string): Promise<MouvementRepas[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mouvements_repas")
    .select("*")
    .eq("eleve_id", eleveId)
    .order("created_at", { ascending: false })
    .limit(15);
  if (error) throw new Error(messageErreur(error, "Grand livre indisponible."));
  return (data ?? []) as MouvementRepas[];
}
