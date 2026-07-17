import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BadgesContent } from "@/features/badges/badges-content";

export const metadata: Metadata = { title: "Badges" };

export default function BadgesPage() {
  return (
    <>
      <PageHeader
        title="Badges QR"
        description="Génération et impression des badges officiels signés — par classe ou pour toute l'école."
      />
      <BadgesContent />
    </>
  );
}
