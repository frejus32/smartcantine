import { createClient } from "@/lib/supabase/client";
import type { Classe, Eleve } from "@/types/entities";
import type { NiveauScolaire } from "@/types/database";

/**
 * Service d'écriture (gestion) — Sprint 4.
 * Chaque fonction appelle une RPC métier ; l'établissement est forcé côté base.
 * Aucune règle métier ici : validation de forme uniquement.
 */

function messageErreur(error: { message?: string } | null, fallback: string): string {
  return error?.message?.replace(/^.*?: /, "") || fallback;
}

export async function creerClasse(nom: string, niveau: NiveauScolaire): Promise<Classe> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("creer_classe", { p_nom: nom, p_niveau: niveau });
  if (error) throw new Error(messageErreur(error, "Création de la classe refusée."));
  return data as Classe;
}

export type EleveFormulaire = {
  classeId: string;
  matricule: string;
  nom: string;
  prenoms: string;
  dateNaissance?: string | null;
  consentementPhoto?: boolean;
};

export async function creerEleve(f: EleveFormulaire): Promise<Eleve> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("creer_eleve", {
    p_classe_id: f.classeId,
    p_matricule: f.matricule,
    p_nom: f.nom,
    p_prenoms: f.prenoms,
    p_date_naissance: f.dateNaissance ?? null,
    p_consentement_photo: f.consentementPhoto ?? false,
  });
  if (error) throw new Error(messageErreur(error, "Inscription refusée."));
  return data as Eleve;
}

export async function modifierEleve(eleveId: string, f: EleveFormulaire): Promise<Eleve> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("modifier_eleve", {
    p_eleve_id: eleveId,
    p_classe_id: f.classeId,
    p_matricule: f.matricule,
    p_nom: f.nom,
    p_prenoms: f.prenoms,
    p_date_naissance: f.dateNaissance ?? null,
    p_consentement_photo: f.consentementPhoto ?? null,
  });
  if (error) throw new Error(messageErreur(error, "Modification refusée."));
  return data as Eleve;
}

export async function definirStatutEleve(
  eleveId: string,
  statut: "actif" | "desactive",
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("definir_statut_eleve", {
    p_eleve_id: eleveId,
    p_statut: statut,
  });
  if (error) throw new Error(messageErreur(error, "Changement de statut refusé."));
}

/** Upload de la photo dans le bucket privé, puis enregistrement du chemin. */
export async function televerserPhoto(
  eleveId: string,
  etablissementId: string,
  fichier: File,
): Promise<void> {
  const supabase = createClient();
  const extension = fichier.type === "image/webp" ? "webp" : "jpg";
  const chemin = `${etablissementId}/${eleveId}.${extension}`;
  const { error: upErr } = await supabase.storage
    .from("photos-eleves")
    .upload(chemin, fichier, { upsert: true, contentType: fichier.type });
  if (upErr) throw new Error(messageErreur(upErr, "Envoi de la photo impossible."));

  const { error } = await supabase.rpc("definir_photo_eleve", {
    p_eleve_id: eleveId,
    p_photo_path: chemin,
  });
  if (error) throw new Error(messageErreur(error, "Enregistrement de la photo impossible."));
}
