import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ReportsContent } from "@/features/reports/reports-content";

export const metadata: Metadata = { title: "Rapports" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Rapports"
        description="Rapports quotidiens et mensuels — données réelles, exportables en PDF, Excel et CSV."
      />
      <ReportsContent />
    </>
  );
}
