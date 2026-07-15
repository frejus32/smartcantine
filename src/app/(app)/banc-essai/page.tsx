import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Workbench } from "@/features/workbench/workbench";

export const metadata: Metadata = { title: "Banc d'essai" };

export default function BancEssaiPage() {
  return (
    <>
      <PageHeader
        title="Banc d'essai du moteur"
        description="Console administrateur : chaque action appelle directement les fonctions métier PostgreSQL."
      />
      <Workbench />
    </>
  );
}
