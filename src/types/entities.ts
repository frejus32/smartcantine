import type { Database } from "@/types/database";

/** Alias métier : le reste du code ne manipule jamais Database[...] directement. */
export type Etablissement = Database["public"]["Tables"]["etablissements"]["Row"];
export type Profil = Database["public"]["Tables"]["profils"]["Row"];
export type Classe = Database["public"]["Tables"]["classes"]["Row"];
export type Eleve = Database["public"]["Tables"]["eleves"]["Row"];

export type EleveInsert = Database["public"]["Tables"]["eleves"]["Insert"];
export type EleveUpdate = Database["public"]["Tables"]["eleves"]["Update"];
export type ClasseInsert = Database["public"]["Tables"]["classes"]["Insert"];

/** Élève avec sa classe jointe — forme la plus courante côté interface. */
export type EleveAvecClasse = Eleve & { classe: Pick<Classe, "id" | "nom" | "niveau"> };

export type AnneeScolaire = Database["public"]["Tables"]["annees_scolaires"]["Row"];
export type JourExceptionnel = Database["public"]["Tables"]["jours_exceptionnels"]["Row"];
export type MouvementRepas = Database["public"]["Tables"]["mouvements_repas"]["Row"];
export type Passage = Database["public"]["Tables"]["passages"]["Row"];
