import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Calendrier" };

export default function Page() {
  return (
    <>
      <PageHeader title="Calendrier" description="Année scolaire, jours fériés et fermetures." />
      <EmptyState
        icon={CalendarDays}
        title="Module en préparation"
        description="Le calendrier scolaire et le calcul automatique des quotas arrivent au Sprint 5."
      />
    </>
  );
}
