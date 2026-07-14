import type { Metadata } from "next";
import { AlertTriangle, ScanLine, UtensilsCrossed, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Tableau de bord" };

const KPIS = [
  { label: "Repas servis aujourd'hui", icon: UtensilsCrossed },
  { label: "Élèves inscrits", icon: Users },
  { label: "À régulariser", icon: AlertTriangle },
  { label: "Scans du jour", icon: ScanLine },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la cantine — les chiffres arriveront avec les prochains sprints."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-start justify-between p-4 sm:p-6">
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {label}
                </p>
                <p className="text-[32px] leading-10 font-bold">—</p>
              </div>
              <div className="bg-primary-soft flex size-10 items-center justify-center rounded-md">
                <Icon className="text-primary size-5" aria-hidden />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <EmptyState
        icon={ScanLine}
        title="Aucune donnée pour le moment"
        description="Les passages à la cantine s'afficheront ici dès que le module de scan sera livré (Sprint 4)."
      />
    </>
  );
}
