import { createClient } from "@/lib/supabase/client";

function err(e: { message?: string } | null, f: string) {
  return e?.message?.replace(/^.*?: /, "") || f;
}

export type RapportQuotidien = {
  jour: string;
  servis: number;
  a_regulariser: number;
  total_distribues: number;
  annules: number;
  eleves_actifs: number;
  absents: number;
};

export type RapportMensuel = {
  annee: number;
  mois: number;
  total_repas: number;
  jours_service: number;
  moyenne_par_jour: number | null;
  a_regulariser: number;
};

export async function rapportQuotidien(jour?: string): Promise<RapportQuotidien> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("rapport_quotidien", { p_jour: jour });
  if (error) throw new Error(err(error, "Rapport indisponible."));
  return data as RapportQuotidien;
}

export async function rapportQuotidienParClasse(jour?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("rapport_quotidien_par_classe", { p_jour: jour });
  if (error) throw new Error(err(error, "Répartition indisponible."));
  return (data ?? []) as Array<{ classe: string; servis: number }>;
}

export async function rapportMensuel(annee: number, mois: number): Promise<RapportMensuel> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("rapport_mensuel", { p_annee: annee, p_mois: mois });
  if (error) throw new Error(err(error, "Rapport mensuel indisponible."));
  return data as RapportMensuel;
}

export async function rapportMensuelSerie(annee: number, mois: number) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("rapport_mensuel_serie", {
    p_annee: annee,
    p_mois: mois,
  });
  if (error) throw new Error(err(error, "Série indisponible."));
  return (data ?? []) as Array<{ jour: string; servis: number }>;
}
