import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  ScanLine,
  UserPlus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiviteRecente } from "@/features/dashboard/activite-recente";
import { KpiCard } from "@/features/dashboard/kpi-card";
import { RepasChart } from "@/features/dashboard/repas-chart";
import { MOCK_STATS } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Groupe Scolaire Les Colibris — mardi 14 juillet 2026"
        actions={
          <Button asChild>
            <Link href="/scanner">
              <ScanLine aria-hidden /> Ouvrir le scanner
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Repas servis aujourd'hui"
          value={String(MOCK_STATS.repasServis)}
          icon={UtensilsCrossed}
          tone="success"
          delta={{ text: "Service en cours", tone: "success" }}
        />
        <KpiCard
          label="Élèves restants"
          value={String(MOCK_STATS.elevesRestants)}
          icon={Users}
          tone="primary"
          delta={{ text: "sur 254 attendus", tone: "neutral" }}
        />
        <KpiCard
          label="À régulariser"
          value={String(MOCK_STATS.aRegulariser)}
          icon={AlertTriangle}
          tone="warning"
          delta={{ text: "+2 vs hier", tone: "warning" }}
        />
        <KpiCard
          label="Élèves inscrits"
          value={String(MOCK_STATS.elevesActifs)}
          icon={Users}
          tone="primary"
          delta={{ text: MOCK_STATS.classes + " classes", tone: "neutral" }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Repas servis — 14 derniers jours de service</CardTitle>
          </CardHeader>
          <CardContent>
            <RepasChart />
          </CardContent>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
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
              <Button variant="secondary" className="justify-start" asChild>
                <Link href="/reports">
                  <UtensilsCrossed aria-hidden /> Rapport du jour
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ActiviteRecente />
    </>
  );
}
