/**
 * Types de la base de données SmartCantine.
 * Écrits à la main pour le Sprint 2 ; régénérables à l'identique via :
 *   npm run db:types  (supabase gen types typescript --local)
 */

export type RoleUtilisateur = "admin" | "responsable" | "agent";
export type NiveauScolaire = "maternelle" | "primaire" | "college";
export type StatutEleve = "actif" | "desactive";
export type TypeJourExceptionnel = "ferie" | "vacances" | "fermeture";
export type TypeMouvement = "credit_mois" | "credit_carnet" | "consommation" | "ajustement";
export type TypeService = "dejeuner";
export type StatutPassage = "servi" | "a_regulariser" | "annule";
export type PolitiqueSolde = "strict" | "dette";

// Le contrat du verdict de scan vit dans "@/lib/scan/verdict" (source unique).

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      etablissements: {
        Row: {
          id: string;
          code: string;
          nom: string;
          ville: string | null;
          politique_solde_epuise: PolitiqueSolde;
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
          politique_solde_epuise?: PolitiqueSolde;
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
      annees_scolaires: {
        Row: {
          id: string;
          etablissement_id: string;
          libelle: string;
          date_debut: string;
          date_fin: string;
          jours_semaine: number[];
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          etablissement_id: string;
          libelle: string;
          date_debut: string;
          date_fin: string;
          jours_semaine?: number[];
          actif?: boolean;
        };
        Update: {
          libelle?: string;
          date_debut?: string;
          date_fin?: string;
          jours_semaine?: number[];
          actif?: boolean;
        };
        Relationships: [];
      };
      jours_exceptionnels: {
        Row: {
          id: string;
          etablissement_id: string;
          annee_scolaire_id: string;
          jour: string;
          type: TypeJourExceptionnel;
          motif: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          etablissement_id: string;
          annee_scolaire_id: string;
          jour: string;
          type: TypeJourExceptionnel;
          motif: string;
        };
        Update: {
          jour?: string;
          type?: TypeJourExceptionnel;
          motif?: string;
        };
        Relationships: [];
      };
      mouvements_repas: {
        Row: {
          id: string;
          etablissement_id: string;
          eleve_id: string;
          type: TypeMouvement;
          quantite: number;
          periode: string | null;
          passage_id: string | null;
          motif: string | null;
          auteur_id: string;
          created_at: string;
        };
        Insert: never; // écriture exclusivement via les fonctions métier
        Update: never; // journal append-only
        Relationships: [];
      };
      passages: {
        Row: {
          id: string;
          etablissement_id: string;
          eleve_id: string;
          date_service: string;
          type_service: TypeService;
          statut: StatutPassage;
          horodatage: string;
          auteur_id: string;
          annule_a: string | null;
          annule_par: string | null;
        };
        Insert: never; // écriture exclusivement via enregistrer_passage
        Update: never; // seule l'annulation via annuler_passage est possible
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      est_jour_ouvert: {
        Args: { p_annee_scolaire_id: string; p_jour: string };
        Returns: boolean;
      };
      quota_du_mois: {
        Args: { p_annee_scolaire_id: string; p_annee: number; p_mois: number };
        Returns: number;
      };
      solde_eleve: {
        Args: { p_eleve_id: string };
        Returns: number;
      };
      crediter_mois: {
        Args: { p_eleve_id: string; p_annee: number; p_mois: number; p_a_partir_de?: string };
        Returns: Json;
      };
      crediter_carnet: {
        Args: { p_eleve_id: string; p_quantite: number };
        Returns: Json;
      };
      ajuster_solde: {
        Args: { p_eleve_id: string; p_quantite: number; p_motif: string };
        Returns: Json;
      };
      enregistrer_passage: {
        Args: { p_eleve_id: string };
        Returns: Json;
      };
      annuler_passage: {
        Args: { p_passage_id: string };
        Returns: Json;
      };
      banc_essai_passage_veille: {
        Args: { p_eleve_id: string };
        Returns: Json;
      };
    };
    Enums: {
      role_utilisateur: RoleUtilisateur;
      niveau_scolaire: NiveauScolaire;
      statut_eleve: StatutEleve;
      type_jour_exceptionnel: TypeJourExceptionnel;
      type_mouvement: TypeMouvement;
      type_service: TypeService;
      statut_passage: StatutPassage;
      politique_solde: PolitiqueSolde;
    };
  };
};
