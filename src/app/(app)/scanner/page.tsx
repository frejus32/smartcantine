import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ScanScreen } from "@/scanner/components/scan-screen";

export const metadata: Metadata = { title: "Scanner" };

export default function ScannerPage() {
  return (
    <>
      <PageHeader
        title="Scanner"
        description="Poste de scan du déjeuner — badges signés, verdict du moteur en moins de 2 secondes."
      />
      <ScanScreen />
    </>
  );
}
