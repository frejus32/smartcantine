import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Scanner" };

export default function Page() {
  return (
    <>
      <PageHeader title="Scanner" description="Point de scan des badges à la cantine." />
      <EmptyState
        icon={ScanLine}
        title="Module en préparation"
        description="Le scan des badges avec verdict vert / orange / rouge arrive au Sprint 4."
      />
    </>
  );
}
