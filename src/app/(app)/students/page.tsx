import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Élèves" };

export default function Page() {
  return (
    <>
      <PageHeader title="Élèves" description="Inscriptions, photos et badges QR des élèves." />
      <EmptyState
        icon={Users}
        title="Module en préparation"
        description="L'inscription des élèves et l'édition des badges arrivent au Sprint 3."
      />
    </>
  );
}
