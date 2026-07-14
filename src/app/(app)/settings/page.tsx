import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Configuration de l'établissement et des comptes."
      />
      <EmptyState
        icon={Settings}
        title="Module en préparation"
        description="Le paramétrage de l'établissement arrive avec les modules métier."
      />
    </>
  );
}
