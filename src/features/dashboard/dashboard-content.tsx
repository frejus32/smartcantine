"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CameraOff,
  CreditCard,
  ScanLine,
  TicketCheck,
  UserPlus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/features/dashboard/kpi-card";
import {
  activiteRecente,
  alertesDashboard,
  serieRepas,
  statsDashboard,
  type ActiviteItem,
  type AlertesDashboard,
  type StatsDashboard,
} from "@/services/moteur.service";
import { getInitials } from "@/utils/initials";

const STATUT_BADGE = {
  servi: { label: "Servi", variant: "success" as const },
  a_regulariser: { label: "À régulariser", variant: "warning" as const },
  annule: { label: "Annulé", variant: "neutral" as const },
};

export function DashboardContent() {
  const [stats, setStats] = useState<StatsDashboard | null>(null);
  const [alertes, setAlertes] = useState<AlertesDashboard | null>(null);
  const [serie, setSerie] = useState<Array<{ jour: string; servis: number }>>([]);
  const [activite, setActivite] = useState<ActiviteItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  function charger() {
    setChargement(true);
    setErreur(null);
    Promise.all([statsDashboard(), alertesDashboard(), serieRepas(14), activiteRecente(8)])
      .then(([s, al, se, a]) => {
        setStats(s);
        setAlertes(al);
        setSerie(se.map((p) => ({ jour: p.jour.slice(5).replace("-", "/"), servis: p.servis })));
        setActivite(a);
      })
      .catch((e: Error) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(charger, []);

  if (chargement) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (erreur) return <ErrorState description={erreur} onRetry={charger} />;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Repas servis aujourd'hui"
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
          label="Élèves inscrits"
          value={String(stats?.eleves_actifs ?? 0)}
          icon={Users}
          tone="primary"
          delta={{ text: `${stats?.classes ?? 0} classes`, tone: "neutral" }}
        />
        <KpiCard
          label="Quota total restant"
          value={String(alertes?.quota_total_restant ?? 0)}
          icon={TicketCheck}
          tone="primary"
          delta={{ text: "repas crédités", tone: "neutral" }}
        />
      </div>

      {alertes &&
      (alertes.dettes > 0 || alertes.soldes_epuises > 0 || alertes.photos_manquantes > 0) ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {alertes.dettes > 0 ? (
            <AlerteCarte
              icon={CreditCard}
              ton="warning"
              titre={`${alertes.dettes} élève${alertes.dettes > 1 ? "s" : ""} en dette`}
              detail="Solde négatif — à régulariser à l'économat."
              lien="/students"
            />
          ) : null}
          {alertes.soldes_epuises > 0 ? (
            <AlerteCarte
              icon={AlertTriangle}
              ton="warning"
              titre={`${alertes.soldes_epuises} solde${alertes.soldes_epuises > 1 ? "s" : ""} épuisé${alertes.soldes_epuises > 1 ? "s" : ""}`}
              detail="Créditez le mois ou un carnet pour ces élèves."
              lien="/students"
            />
          ) : null}
          {alertes.photos_manquantes > 0 ? (
            <AlerteCarte
              icon={CameraOff}
              ton="primary"
              titre={`${alertes.photos_manquantes} photo${alertes.photos_manquantes > 1 ? "s" : ""} manquante${alertes.photos_manquantes > 1 ? "s" : ""}`}
              detail="La photo sécurise le contrôle visuel au scan."
              lien="/students"
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Repas servis — jours de service récents</CardTitle>
          </CardHeader>
          <CardContent>
            {serie.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="Aucun passage enregistré"
                description="La courbe se remplira dès les premiers scans à la cantine."
                className="py-10"
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="fillServis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E5AA8" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#1E5AA8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
                    <XAxis
                      dataKey="jour"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      width={40}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #E2E6EC", fontSize: 13 }}
                      formatter={(v) => [`${v} repas`, "Servis"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="servis"
                      stroke="#1E5AA8"
                      strokeWidth={2}
                      fill="url(#fillServis)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="secondary" className="justify-start" asChild>
              <Link href="/scanner">
                <ScanLine aria-hidden /> Ouvrir le scanner
              </Link>
            </Button>
            <Button variant="secondary" className="justify-start" asChild>
              <Link href="/students">
                <UserPlus aria-hidden /> Inscrire un élève
              </Link>
            </Button>
            <Button variant="secondary" className="justify-start" asChild>
              <Link href="/calendar">
                <CalendarDays aria-hidden /> Vérifier le calendrier
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <Badge variant="neutral">Aujourd&apos;hui</Badge>
        </CardHeader>
        <CardContent className="divide-y">
          {activite.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Aucun passage aujourd&apos;hui pour le moment.
            </p>
          ) : (
            activite.map((a) => (
              <div key={a.passage_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">{getInitials(a.eleve)}</AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{a.eleve}</p>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={STATUT_BADGE[a.statut].variant}>
                    {STATUT_BADGE[a.statut].label}
                  </Badge>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {new Date(a.heure).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Carte d'alerte actionnable du dashboard. */
function AlerteCarte({
  icon: Icon,
  ton,
  titre,
  detail,
  lien,
}: {
  icon: typeof AlertTriangle;
  ton: "warning" | "primary";
  titre: string;
  detail: string;
  lien: string;
}) {
  const couleur =
    ton === "warning"
      ? "border-l-warning bg-warning-soft/40"
      : "border-l-primary bg-primary-soft/40";
  const iconColor = ton === "warning" ? "text-warning" : "text-primary";
  return (
    <Link
      href={lien}
      className={`hover:bg-secondary flex items-start gap-3 rounded-lg border border-l-4 p-4 transition-colors ${couleur}`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${iconColor}`} aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold">{titre}</p>
        <p className="text-muted-foreground text-sm">{detail}</p>
      </div>
    </Link>
  );
}
