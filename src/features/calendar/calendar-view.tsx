"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatutJour = "ouvert" | "ferie" | "fermeture" | "vacances" | "weekend";

type Mois = {
  label: string;
  annee: number;
  moisIndex: number; // 0-11
  speciaux: Record<number, { statut: Exclude<StatutJour, "ouvert" | "weekend">; motif: string }>;
};

/** Année scolaire 2026-2027 (démonstration). */
const MOIS: Mois[] = [
  {
    label: "Octobre",
    annee: 2026,
    moisIndex: 9,
    speciaux: {
      26: { statut: "vacances", motif: "Vacances de Toussaint" },
      27: { statut: "vacances", motif: "Vacances de Toussaint" },
      28: { statut: "vacances", motif: "Vacances de Toussaint" },
      29: { statut: "vacances", motif: "Vacances de Toussaint" },
      30: { statut: "vacances", motif: "Vacances de Toussaint" },
    },
  },
  {
    label: "Novembre",
    annee: 2026,
    moisIndex: 10,
    speciaux: {
      2: { statut: "vacances", motif: "Vacances de Toussaint" },
      16: { statut: "ferie", motif: "Journée nationale de la paix (15/11 reportée)" },
      27: { statut: "fermeture", motif: "Fermeture exceptionnelle — travaux cuisine" },
    },
  },
  {
    label: "Décembre",
    annee: 2026,
    moisIndex: 11,
    speciaux: {
      7: { statut: "ferie", motif: "Fête nationale" },
      21: { statut: "vacances", motif: "Vacances de Noël" },
      22: { statut: "vacances", motif: "Vacances de Noël" },
      23: { statut: "vacances", motif: "Vacances de Noël" },
      24: { statut: "vacances", motif: "Vacances de Noël" },
      25: { statut: "ferie", motif: "Noël" },
      28: { statut: "vacances", motif: "Vacances de Noël" },
      29: { statut: "vacances", motif: "Vacances de Noël" },
      30: { statut: "vacances", motif: "Vacances de Noël" },
      31: { statut: "vacances", motif: "Vacances de Noël" },
    },
  },
];

const STYLES: Record<StatutJour, { pastille: string; fond: string; label: string }> = {
  ouvert: {
    pastille: "bg-success",
    fond: "bg-success-soft/60 hover:bg-success-soft",
    label: "Cantine ouverte",
  },
  ferie: { pastille: "bg-destructive", fond: "bg-destructive-soft/60", label: "Jour férié" },
  fermeture: {
    pastille: "bg-warning",
    fond: "bg-warning-soft/70",
    label: "Fermeture exceptionnelle",
  },
  vacances: { pastille: "bg-info", fond: "bg-info-soft/60", label: "Vacances scolaires" },
  weekend: { pastille: "bg-input", fond: "bg-secondary/50", label: "Week-end (pas de service)" },
};

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function statutDuJour(mois: Mois, jour: number): { statut: StatutJour; motif?: string } {
  const date = new Date(mois.annee, mois.moisIndex, jour);
  const js = date.getDay();
  if (js === 0 || js === 6) return { statut: "weekend" };
  const special = mois.speciaux[jour];
  return special ? { statut: special.statut, motif: special.motif } : { statut: "ouvert" };
}

export function CalendarView() {
  const [index, setIndex] = useState(1); // Novembre par défaut
  const mois = MOIS[index];
  const nbJours = new Date(mois.annee, mois.moisIndex + 1, 0).getDate();
  const premierJour = (new Date(mois.annee, mois.moisIndex, 1).getDay() + 6) % 7; // Lundi = 0
  const jours = Array.from({ length: nbJours }, (_, i) => i + 1);
  const joursOuverts = jours.filter((j) => statutDuJour(mois, j).statut === "ouvert").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Mois précédent"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <CardTitle className="w-44 text-center">
              {mois.label} {mois.annee}
            </CardTitle>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIndex((i) => Math.min(MOIS.length - 1, i + 1))}
              disabled={index === MOIS.length - 1}
              aria-label="Mois suivant"
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
          <Badge variant="success" className="h-7 px-3 text-sm">
            {joursOuverts} jours de cantine — quota du mois
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {JOURS_SEMAINE.map((j) => (
              <div
                key={j}
                className="text-muted-foreground pb-1 text-center text-xs font-semibold uppercase"
              >
                {j}
              </div>
            ))}
            {Array.from({ length: premierJour }).map((_, i) => (
              <div key={"v" + i} />
            ))}
            {jours.map((jour) => {
              const { statut, motif } = statutDuJour(mois, jour);
              const style = STYLES[statut];
              return (
                <div
                  key={jour}
                  title={motif ?? style.label}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-md text-sm font-medium transition-colors sm:aspect-[4/3]",
                    style.fond,
                    statut === "weekend" && "text-muted-foreground",
                  )}
                >
                  <span className="tabular-nums">{jour}</span>
                  <span className={cn("size-1.5 rounded-full", style.pastille)} aria-hidden />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 sm:p-5">
          {(Object.keys(STYLES) as StatutJour[]).map((s) => (
            <span key={s} className="text-foreground/80 inline-flex items-center gap-2 text-sm">
              <span className={cn("size-2.5 rounded-full", STYLES[s].pastille)} aria-hidden />
              {STYLES[s].label}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
