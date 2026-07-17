import * as XLSX from "xlsx";
import { creerEleve, type EleveFormulaire } from "@/services/gestion.service";
import type { ClasseDetail, EleveDetail } from "@/services/moteur.service";

/**
 * Import Excel des élèves — Sprint 5.
 * Le fichier est parsé et validé côté client ; la création passe ensuite
 * exclusivement par la fonction métier creer_eleve (aucune règle dupliquée).
 * Colonnes attendues (insensibles à la casse/accents) : matricule, nom, prenoms, classe.
 */

export type LigneImport = {
  ligne: number;
  matricule: string;
  nom: string;
  prenoms: string;
  classe: string;
  classeId: string | null;
  statut: "valide" | "doublon" | "erreur";
  message?: string;
};

const normaliser = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const ENTETES: Record<string, string> = {
  matricule: "matricule",
  nom: "nom",
  prenoms: "prenoms",
  prenom: "prenoms",
  classe: "classe",
};

export function analyserFichier(
  buffer: ArrayBuffer,
  classes: ClasseDetail[],
  elevesExistants: EleveDetail[],
): LigneImport[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const feuille = wb.Sheets[wb.SheetNames[0]];
  const lignes = XLSX.utils.sheet_to_json<Record<string, unknown>>(feuille, { defval: "" });

  const classeParNom = new Map(classes.map((c) => [normaliser(c.nom), c.id]));
  const matriculesExistants = new Set(elevesExistants.map((e) => normaliser(e.matricule)));
  const matriculesVus = new Set<string>();

  return lignes.map((brut, i) => {
    // Résolution souple des en-têtes.
    const valeurs: Record<string, string> = {};
    for (const [cle, val] of Object.entries(brut)) {
      const norm = ENTETES[normaliser(cle)];
      if (norm) valeurs[norm] = String(val).trim();
    }

    const matricule = valeurs.matricule ?? "";
    const nom = valeurs.nom ?? "";
    const prenoms = valeurs.prenoms ?? "";
    const classe = valeurs.classe ?? "";
    const classeId = classeParNom.get(normaliser(classe)) ?? null;
    const base = { ligne: i + 2, matricule, nom, prenoms, classe, classeId };

    if (!matricule || !nom || !prenoms || !classe) {
      return { ...base, statut: "erreur", message: "Champs obligatoires manquants." };
    }
    if (!classeId) {
      return { ...base, statut: "erreur", message: `Classe « ${classe} » introuvable.` };
    }
    const mNorm = normaliser(matricule);
    if (matriculesExistants.has(mNorm)) {
      return { ...base, statut: "doublon", message: "Matricule déjà inscrit." };
    }
    if (matriculesVus.has(mNorm)) {
      return { ...base, statut: "doublon", message: "Matricule en double dans le fichier." };
    }
    matriculesVus.add(mNorm);
    return { ...base, statut: "valide" };
  });
}

export type ResultatImport = { crees: number; echecs: Array<{ ligne: number; message: string }> };

/** Importe les lignes valides via creer_eleve. Les erreurs métier sont collectées. */
export async function importerLignes(lignes: LigneImport[]): Promise<ResultatImport> {
  const aImporter = lignes.filter((l) => l.statut === "valide" && l.classeId);
  const echecs: Array<{ ligne: number; message: string }> = [];
  let crees = 0;

  for (const l of aImporter) {
    const form: EleveFormulaire = {
      classeId: l.classeId!,
      matricule: l.matricule,
      nom: l.nom,
      prenoms: l.prenoms,
    };
    try {
      await creerEleve(form);
      crees++;
    } catch (e) {
      echecs.push({ ligne: l.ligne, message: e instanceof Error ? e.message : "Échec." });
    }
  }
  return { crees, echecs };
}

/** Génère un modèle Excel téléchargeable avec les bons en-têtes et un exemple. */
export function genererModele(classes: ClasseDetail[]): Blob {
  const exemple = [
    {
      matricule: "COL-0100",
      nom: "Kouassi",
      prenoms: "Aya Grâce",
      classe: classes[0]?.nom ?? "CM2 B",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(exemple);
  ws["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Élèves");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
