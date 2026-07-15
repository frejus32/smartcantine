import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ScannerDemo } from "@/features/scanner/scanner-demo";

export const metadata: Metadata = { title: "Scanner" };

export default function ScannerPage() {
  return (
    <>
      <PageHeader
        title="Scanner"
        description="Poste de scan du déjeuner — verdict en moins de 2 secondes, avec ou sans réseau."
      />
      <ScannerDemo />
    </>
  );
}
