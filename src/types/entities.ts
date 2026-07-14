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
