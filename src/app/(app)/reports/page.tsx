import type { Metadata } from "next";
import { AlertTriangle, Ban, Percent, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/features/dashboard/kpi-card";
import { ExportButtons } from "@/features/reports/export-buttons";
import { RepasParClasseChart, TendanceChart } from "@/features/reports/reports-charts";

export const metadata: Metadata = { title: "Rapports" };

const LIGNES = [
  { date: "14/07/2026", servis: 213, regularises: 7, refus: 3 },
  { date: "13/07/2026", servis: 242, regularises: 5, refus: 1 },
  { date: "10/07/2026", servis: 255, regularises: 4, refus: 2 },
  { date: "09/07/2026", servis: 249, regularises: 6, refus: 0 },
  { date: "08/07/2026", servis: 233, regularises: 3, refus: 2 },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Rapports"
        description="Repas servis, régularisations et anomalies — chiffres opposables, exportables."
        actions={<ExportButtons />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Servis aujourd'hui" value="213" icon={UtensilsCrossed} tone="success" />
        <KpiCard label="À régulariser" value="7" icon={AlertTriangle} tone="warning" />
        <KpiCard label="Refus (déjà servi)" value="3" icon={Ban} tone="danger" />
        <KpiCard label="Taux de présence cantine" value="84 %" icon={Percent} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Repas servis par classe — aujourd&apos;hui</CardTitle>
          </CardHeader>
          <CardContent>
            <RepasParClasseChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tendance — 14 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <TendanceChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Derniers jours de service</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Repas servis</TableHead>
                <TableHead className="text-right">À régulariser</TableHead>
                <TableHead className="text-right">Refus</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LIGNES.map((l) => (
                <TableRow key={l.date}>
                  <TableCell className="font-medium tabular-nums">{l.date}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.servis}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.regularises}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.refus}</TableCell>
                  <TableCell className="text-right">
                    {l.regularises > 5 ? (
                      <Badge variant="warning">À vérifier</Badge>
                    ) : (
                      <Badge variant="success">Rapproché</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
