import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ExportButtons } from "@/features/reports/export-buttons";
import { ReportsContent } from "@/features/reports/reports-content";

export const metadata: Metadata = { title: "Rapports" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Rapports"
        description="Repas servis, régularisations et anomalies — données réelles."
        actions={<ExportButtons />}
      />
      <ReportsContent />
    </>
  );
}
