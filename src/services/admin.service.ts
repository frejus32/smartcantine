import { createClient } from "@/lib/supabase/client";
import type { Etablissement, JourExceptionnel } from "@/types/entities";
import type { RoleUtilisateur, TypeJourExceptionnel } from "@/types/database";

function err(e: { message?: string } | null, f: string) {
  return e?.message?.replace(/^.*?: /, "") || f;
}

export type Utilisateur = {
  id: string;
  nom_complet: string;
  role: RoleUtilisateur;
  email: string;
  created_at: string;
};

export type EntreeAudit = {
  id: number;
  auteur_nom: string | null;
  action: string;
  cible: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export async function chargerEtablissement(): Promise<Etablissement> {
  const supabase = createClient();
  const { data, error } = await supabase.from("etablissements").select("*").limit(1).single();
  if (error) throw new Error(err(error, "Établissement indisponible."));
  return data as Etablissement;
}

export type ParametresEtablissement = {
  nom?: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  ville?: string | null;
  heureService?: string;
  politique?: "strict" | "dette";
  reinitAuto?: boolean;
};

export async function modifierEtablissement(p: ParametresEtablissement): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("modifier_etablissement", {
    p_nom: p.nom,
    p_adresse: p.adresse ?? undefined,
    p_telephone: p.telephone ?? undefined,
    p_email: p.email ?? undefined,
    p_ville: p.ville ?? undefined,
    p_heure_service: p.heureService,
    p_politique: p.politique,
    p_reinit_auto: p.reinitAuto,
  });
  if (error) throw new Error(err(error, "Enregistrement refusé."));
}

export async function televerserLogo(etablissementId: string, fichier: File): Promise<void> {
  const supabase = createClient();
  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "png";
  const chemin = `${etablissementId}/logo.${ext}`;
  const { error: up } = await supabase.storage
    .from("logos-etablissements")
    .upload(chemin, fichier, { upsert: true, contentType: fichier.type });
  if (up) throw new Error(err(up, "Envoi du logo impossible."));
  const { error } = await supabase.rpc("modifier_etablissement", { p_logo_path: chemin });
  if (error) throw new Error(err(error, "Enregistrement du logo impossible."));
}

export async function listerUtilisateurs(): Promise<Utilisateur[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("lister_utilisateurs");
  if (error) throw new Error(err(error, "Utilisateurs indisponibles."));
  return (data ?? []) as Utilisateur[];
}

export async function definirRole(userId: string, role: RoleUtilisateur): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("definir_role_utilisateur", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw new Error(err(error, "Changement de rôle refusé."));
}

export async function listerAudit(limite = 50): Promise<EntreeAudit[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("lister_audit", { p_limite: limite });
  if (error) throw new Error(err(error, "Journal d'audit indisponible."));
  return (data ?? []) as EntreeAudit[];
}

export async function listerJoursExceptionnels(): Promise<JourExceptionnel[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("lister_jours_exceptionnels");
  if (error) throw new Error(err(error, "Calendrier indisponible."));
  return (data ?? []) as JourExceptionnel[];
}

export async function ajouterJourExceptionnel(
  jour: string,
  type: TypeJourExceptionnel,
  motif: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("ajouter_jour_exceptionnel", {
    p_jour: jour,
    p_type: type,
    p_motif: motif,
  });
  if (error) throw new Error(err(error, "Ajout refusé."));
}

export async function supprimerJourExceptionnel(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("supprimer_jour_exceptionnel", { p_id: id });
  if (error) throw new Error(err(error, "Suppression refusée."));
}
