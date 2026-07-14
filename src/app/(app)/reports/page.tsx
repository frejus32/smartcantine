import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Rapports" };

export default function Page() {
  return (
    <>
      <PageHeader title="Rapports" description="Repas servis, régularisations et historique." />
      <EmptyState
        icon={BarChart3}
        title="Module en préparation"
        description="Le rapport journalier arrive au Sprint 6."
      />
    </>
  );
}
