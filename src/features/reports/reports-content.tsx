"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  UserX,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { KpiCard } from "@/features/dashboard/kpi-card";
import {
  rapportMensuel,
  rapportMensuelSerie,
  rapportQuotidien,
  rapportQuotidienParClasse,
  type RapportMensuel,
  type RapportQuotidien,
} from "@/services/rapports.service";
import { exporterCSV, exporterExcel, exporterPDF } from "@/services/export.service";

const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 12, fill: "#6B7280" } } as const;
const TOOLTIP = { borderRadius: 8, border: "1px solid #E2E6EC", fontSize: 13 } as const;

const MOIS_NOMS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function ReportsContent() {
  const [onglet, setOnglet] = useState<"quotidien" | "mensuel">("quotidien");
  const [jour, setJour] = useState(() => new Date().toISOString().slice(0, 10));
  const [rq, setRq] = useState<RapportQuotidien | null>(null);
  const [parClasse, setParClasse] = useState<Array<{ classe: string; servis: number }>>([]);
  const maintenant = new Date();
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [mois, setMois] = useState(maintenant.getMonth() + 1);
  const [rm, setRm] = useState<RapportMensuel | null>(null);
  const [serie, setSerie] = useState<Array<{ jour: string; servis: number }>>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerQuotidien = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [r, pc] = await Promise.all([rapportQuotidien(jour), rapportQuotidienParClasse(jour)]);
      setRq(r);
      setParClasse(pc);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Rapport indisponible.");
    } finally {
      setChargement(false);
    }
  }, [jour]);

  const chargerMensuel = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [r, s] = await Promise.all([
        rapportMensuel(annee, mois),
        rapportMensuelSerie(annee, mois),
      ]);
      setRm(r);
      setSerie(s.map((p) => ({ jour: p.jour.slice(8), servis: p.servis })));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Rapport indisponible.");
    } finally {
      setChargement(false);
    }
  }, [annee, mois]);

  useEffect(() => {
    if (onglet === "quotidien") void chargerQuotidien();
    else void chargerMensuel();
  }, [onglet, chargerQuotidien, chargerMensuel]);

  function exporter(format: "pdf" | "excel" | "csv") {
    if (onglet === "quotidien" && rq) {
      const lignes = [
        { Indicateur: "Élèves servis", Valeur: rq.servis },
        { Indicateur: "À régulariser", Valeur: rq.a_regulariser },
        { Indicateur: "Repas distribués", Valeur: rq.total_distribues },
        { Indicateur: "Élèves absents", Valeur: rq.absents },
        { Indicateur: "Annulations", Valeur: rq.annules },
      ];
      const nom = `rapport-quotidien-${jour}`;
      if (format === "csv") exporterCSV(lignes, nom);
      else if (format === "excel") exporterExcel(lignes, nom, "Quotidien");
      else
        exporterPDF(
          "Rapport quotidien",
          `Journée du ${jour}`,
          ["Indicateur", "Valeur"],
          lignes.map((l) => [l.Indicateur, l.Valeur]),
          nom,
        );
      toast.success(`Export ${format.toUpperCase()} généré.`);
    } else if (rm) {
      const lignes = [
        { Indicateur: "Total repas", Valeur: rm.total_repas },
        { Indicateur: "Jours de service", Valeur: rm.jours_service },
        { Indicateur: "Moyenne par jour", Valeur: rm.moyenne_par_jour ?? 0 },
        { Indicateur: "À régulariser", Valeur: rm.a_regulariser },
      ];
      const nom = `rapport-mensuel-${annee}-${String(mois).padStart(2, "0")}`;
      if (format === "csv") exporterCSV(lignes, nom);
      else if (format === "excel") exporterExcel(lignes, nom, "Mensuel");
      else
        exporterPDF(
          "Rapport mensuel",
          `${MOIS_NOMS[mois - 1]} ${annee}`,
          ["Indicateur", "Valeur"],
          lignes.map((l) => [l.Indicateur, l.Valeur]),
          nom,
        );
      toast.success(`Export ${format.toUpperCase()} généré.`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="bg-card inline-flex rounded-lg border p-1">
          <button
            onClick={() => setOnglet("quotidien")}
            className={
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors " +
              (onglet === "quotidien"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground")
            }
          >
            Quotidien
          </button>
          <button
            onClick={() => setOnglet("mensuel")}
            className={
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors " +
              (onglet === "mensuel"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground")
            }
          >
            Mensuel
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onglet === "quotidien" ? (
            <input
              type="date"
              value={jour}
              onChange={(e) => setJour(e.target.value)}
              className="border-input bg-card h-11 rounded-md border px-3 text-[15px]"
              aria-label="Jour du rapport"
            />
          ) : (
            <>
              <NativeSelect
                value={mois}
                onChange={(e) => setMois(Number(e.target.value))}
                aria-label="Mois"
                className="w-36"
              >
                {MOIS_NOMS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={annee}
                onChange={(e) => setAnnee(Number(e.target.value))}
                aria-label="Année"
                className="w-28"
              >
                {[annee - 1, annee, annee + 1].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </NativeSelect>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => exporter("pdf")}>
          <FileText aria-hidden /> PDF
        </Button>
        <Button variant="secondary" size="sm" onClick={() => exporter("excel")}>
          <FileSpreadsheet aria-hidden /> Excel
        </Button>
        <Button variant="secondary" size="sm" onClick={() => exporter("csv")}>
          <FileSpreadsheet aria-hidden /> CSV
        </Button>
      </div>

      {chargement ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : erreur ? (
        <ErrorState
          description={erreur}
          onRetry={() => (onglet === "quotidien" ? chargerQuotidien() : chargerMensuel())}
        />
      ) : onglet === "quotidien" && rq ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Élèves servis"
              value={String(rq.servis)}
              icon={CheckCircle2}
              tone="success"
            />
            <KpiCard
              label="À régulariser"
              value={String(rq.a_regulariser)}
              icon={AlertTriangle}
              tone="warning"
            />
            <KpiCard
              label="Repas distribués"
              value={String(rq.total_distribues)}
              icon={Users}
              tone="primary"
            />
            <KpiCard
              label="Élèves absents"
              value={String(rq.absents)}
              icon={UserX}
              tone="primary"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Repas servis par classe</CardTitle>
            </CardHeader>
            <CardContent>
              {parClasse.every((c) => c.servis === 0) ? (
                <EmptyState
                  icon={Ban}
                  title="Aucun repas ce jour"
                  description="Aucun passage n'a été enregistré à cette date."
                  className="border-0 py-12"
                />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={parClasse} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
                      <XAxis dataKey="classe" {...AXIS} />
                      <YAxis {...AXIS} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "#EAF1F9" }}
                        contentStyle={TOOLTIP}
                        formatter={(v) => [`${v} repas`, "Servis"]}
                      />
                      <Bar dataKey="servis" fill="#1E5AA8" radius={[6, 6, 0, 0]} maxBarSize={56} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : rm ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total repas du mois"
              value={String(rm.total_repas)}
              icon={Users}
              tone="success"
            />
            <KpiCard
              label="Jours de service"
              value={String(rm.jours_service)}
              icon={CheckCircle2}
              tone="primary"
            />
            <KpiCard
              label="Moyenne / jour"
              value={String(rm.moyenne_par_jour ?? 0)}
              icon={Users}
              tone="primary"
            />
            <KpiCard
              label="À régulariser"
              value={String(rm.a_regulariser)}
              icon={AlertTriangle}
              tone="warning"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Consommation du mois</CardTitle>
            </CardHeader>
            <CardContent>
              {serie.length === 0 ? (
                <EmptyState
                  icon={Ban}
                  title="Aucune donnée ce mois"
                  description="Les repas s'afficheront dès les premiers passages du mois."
                  className="border-0 py-12"
                />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
                      <XAxis dataKey="jour" {...AXIS} />
                      <YAxis {...AXIS} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v} repas`, "Servis"]} />
                      <Line
                        type="monotone"
                        dataKey="servis"
                        stroke="#1E5AA8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
