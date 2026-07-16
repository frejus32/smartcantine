"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, UtensilsCrossed, Users } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { KpiCard } from "@/features/dashboard/kpi-card";
import { serieRepas, statsDashboard, type StatsDashboard } from "@/services/moteur.service";

const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 12, fill: "#6B7280" } } as const;
const TOOLTIP = { borderRadius: 8, border: "1px solid #E2E6EC", fontSize: 13 } as const;

export function ReportsContent() {
  const [stats, setStats] = useState<StatsDashboard | null>(null);
  const [serie, setSerie] = useState<Array<{ jour: string; servis: number }>>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  function charger() {
    setChargement(true);
    setErreur(null);
    Promise.all([statsDashboard(), serieRepas(14)])
      .then(([s, se]) => {
        setStats(s);
        setSerie(se.map((p) => ({ jour: p.jour.slice(5).replace("-", "/"), servis: p.servis })));
      })
      .catch((e: Error) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(charger, []);

  if (chargement) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (erreur) return <ErrorState description={erreur} onRetry={charger} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Servis aujourd'hui"
          value={String(stats?.repas_servis_aujourdhui ?? 0)}
          icon={UtensilsCrossed}
          tone="success"
        />
        <KpiCard
          label="À régulariser"
          value={String(stats?.a_regulariser_aujourdhui ?? 0)}
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label="Refus (déjà servi)"
          value={String(stats?.refus_aujourdhui ?? 0)}
          icon={Ban}
          tone="danger"
        />
        <KpiCard
          label="Élèves inscrits"
          value={String(stats?.eleves_actifs ?? 0)}
          icon={Users}
          tone="primary"
        />
      </div>

      {serie.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={UtensilsCrossed}
              title="Pas encore de données de service"
              description="Les rapports se construisent à partir des passages enregistrés au scanner."
              className="border-0 py-16"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Repas servis par jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
                    <XAxis dataKey="jour" {...AXIS} />
                    <YAxis {...AXIS} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "#EAF1F9" }}
                      contentStyle={TOOLTIP}
                      formatter={(v) => [`${v} repas`, "Servis"]}
                    />
                    <Bar dataKey="servis" fill="#1E5AA8" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
                    <XAxis dataKey="jour" {...AXIS} />
                    <YAxis {...AXIS} width={40} allowDecimals={false} />
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
