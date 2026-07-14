/**
 * Types de la base de données SmartCantine.
 * Écrits à la main pour le Sprint 2 ; régénérables à l'identique via :
 *   npm run db:types  (supabase gen types typescript --local)
 */

export type RoleUtilisateur = "admin" | "responsable" | "agent";
export type NiveauScolaire = "maternelle" | "primaire" | "college";
export type StatutEleve = "actif" | "desactive";

export type Database = {
  public: {
    Tables: {
      etablissements: {
        Row: {
          id: string;
          code: string;
          nom: string;
          ville: string | null;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          nom: string;
          ville?: string | null;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          nom?: string;
          ville?: string | null;
          actif?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      profils: {
        Row: {
          id: string;
          etablissement_id: string;
          role: RoleUtilisateur;
          nom_complet: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          etablissement_id: string;
          role?: RoleUtilisateur;
          nom_complet: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nom_complet?: string;
          role?: RoleUtilisateur;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profils_etablissement_id_fkey";
            columns: ["etablissement_id"];
            referencedRelation: "etablissements";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          id: string;
          etablissement_id: string;
          nom: string;
          niveau: NiveauScolaire;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          etablissement_id: string;
          nom: string;
          niveau: NiveauScolaire;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nom?: string;
          niveau?: NiveauScolaire;
          actif?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_etablissement_id_fkey";
            columns: ["etablissement_id"];
            referencedRelation: "etablissements";
            referencedColumns: ["id"];
          },
        ];
      };
      eleves: {
        Row: {
          id: string;
          etablissement_id: string;
          classe_id: string;
          matricule: string;
          nom: string;
          prenoms: string;
          date_naissance: string | null;
          photo_path: string | null;
          consentement_photo: boolean;
          consentement_date: string | null;
          statut: StatutEleve;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          etablissement_id: string;
          classe_id: string;
          matricule: string;
          nom: string;
          prenoms: string;
          date_naissance?: string | null;
          photo_path?: string | null;
          consentement_photo?: boolean;
          consentement_date?: string | null;
          statut?: StatutEleve;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          classe_id?: string;
          matricule?: string;
          nom?: string;
          prenoms?: string;
          date_naissance?: string | null;
          photo_path?: string | null;
          consentement_photo?: boolean;
          consentement_date?: string | null;
          statut?: StatutEleve;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "eleves_etablissement_id_fkey";
            columns: ["etablissement_id"];
            referencedRelation: "etablissements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "eleves_classe_id_etablissement_id_fkey";
            columns: ["classe_id", "etablissement_id"];
            referencedRelation: "classes";
            referencedColumns: ["id", "etablissement_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_utilisateur: RoleUtilisateur;
      niveau_scolaire: NiveauScolaire;
      statut_eleve: StatutEleve;
    };
  };
};
