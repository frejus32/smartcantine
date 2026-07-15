/**
 * Données fictives du Sprint UI — remplacées par Supabase aux sprints suivants.
 * Un seul fichier source : toutes les pages racontent la même école.
 */

export type MockClasse = { id: string; nom: string; niveau: "maternelle" | "primaire" | "college" };
export type MockEleve = {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  classeId: string;
  statut: "actif" | "desactive";
  solde: number;
  photoManquante?: boolean;
};

export const MOCK_CLASSES: MockClasse[] = [
  { id: "c1", nom: "Petite Section A", niveau: "maternelle" },
  { id: "c2", nom: "CM2 B", niveau: "primaire" },
  { id: "c3", nom: "5e Rubis", niveau: "college" },
  { id: "c4", nom: "3e Diamant", niveau: "college" },
];

const NOMS: Array<[string, string, string, number]> = [
  ["Kouassi", "Aya Grâce", "c1", 14],
  ["Diabaté", "Moussa", "c1", 9],
  ["Koné", "Fatoumata", "c1", 0],
  ["Assi", "Élodie", "c1", 17],
  ["Yao", "Jean-Marc", "c2", 11],
  ["Traoré", "Aminata", "c2", 6],
  ["N'Dri", "Axel Emmanuel", "c2", 19],
  ["Bamba", "Mariam", "c2", 3],
  ["Kobenan", "Ange Kader", "c2", 12],
  ["Koffi", "Nadège", "c2", 8],
  ["Ouattara", "Ibrahim", "c3", 15],
  ["Gnahoré", "Marie-Ange", "c3", 1],
  ["Soro", "Yaya", "c3", 20],
  ["Aka", "Bénédicte", "c3", 7],
  ["Kouamé", "Olivier", "c3", 0],
  ["Tanoh", "Prisca", "c3", 13],
  ["Zadi", "Wilfried", "c4", 10],
  ["Ehouman", "Raïssa", "c4", 18],
  ["Brou", "Samuel", "c4", 5],
  ["Séka", "Emmanuella", "c4", 16],
  ["Dosso", "Adama", "c4", 2],
  ["Amani", "Rebecca", "c4", 9],
  ["Guédé", "Christ-Yvan", "c4", 4],
  ["Loba", "Sarah", "c4", 12],
];

export const MOCK_ELEVES: MockEleve[] = NOMS.map(([nom, prenoms, classeId, solde], i) => ({
  id: "e" + (i + 1),
  matricule: "COL-" + String(i + 1).padStart(4, "0"),
  nom,
  prenoms,
  classeId,
  statut: i === 14 ? "desactive" : "actif",
  solde,
  photoManquante: i === 2 || i === 21,
}));

export function classeById(id: string): MockClasse {
  return MOCK_CLASSES.find((c) => c.id === id) ?? MOCK_CLASSES[0];
}

export const MOCK_STATS = {
  elevesActifs: MOCK_ELEVES.filter((e) => e.statut === "actif").length,
  classes: MOCK_CLASSES.length,
  repasServis: 213,
  elevesRestants: 41,
  aRegulariser: 7,
  refus: 3,
};

/** 14 derniers jours de service (lun-ven) pour les graphiques. */
export const MOCK_SERIE_REPAS = [
  { jour: "26/06", servis: 231 },
  { jour: "29/06", servis: 244 },
  { jour: "30/06", servis: 238 },
  { jour: "01/07", servis: 251 },
  { jour: "02/07", servis: 226 },
  { jour: "03/07", servis: 247 },
  { jour: "06/07", servis: 252 },
  { jour: "07/07", servis: 240 },
  { jour: "08/07", servis: 233 },
  { jour: "09/07", servis: 249 },
  { jour: "10/07", servis: 255 },
  { jour: "13/07", servis: 242 },
  { jour: "14/07", servis: 213 },
];

export type MockScan = {
  id: string;
  heure: string;
  eleve: MockEleve;
  verdict: "vert" | "rouge" | "orange";
  detail: string;
};

export const MOCK_SCANS: MockScan[] = [
  {
    id: "s1",
    heure: "12:04",
    eleve: MOCK_ELEVES[4],
    verdict: "vert",
    detail: "Solde restant : 10 repas",
  },
  {
    id: "s2",
    heure: "12:03",
    eleve: MOCK_ELEVES[7],
    verdict: "vert",
    detail: "Solde restant : 2 repas",
  },
  {
    id: "s3",
    heure: "12:01",
    eleve: MOCK_ELEVES[11],
    verdict: "rouge",
    detail: "Déjà servi à 11:47",
  },
  {
    id: "s4",
    heure: "11:58",
    eleve: MOCK_ELEVES[2],
    verdict: "orange",
    detail: "Solde épuisé — repas à régulariser",
  },
  {
    id: "s5",
    heure: "11:56",
    eleve: MOCK_ELEVES[12],
    verdict: "vert",
    detail: "Solde restant : 19 repas",
  },
  {
    id: "s6",
    heure: "11:54",
    eleve: MOCK_ELEVES[9],
    verdict: "vert",
    detail: "Solde restant : 7 repas",
  },
];
