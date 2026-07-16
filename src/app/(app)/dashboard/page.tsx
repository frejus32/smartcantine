import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DashboardContent } from "@/features/dashboard/dashboard-content";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la cantine en temps réel."
        actions={
          <Button asChild>
            <Link href="/scanner">
              <ScanLine aria-hidden /> Ouvrir le scanner
            </Link>
          </Button>
        }
      />
      <DashboardContent />
    </>
  );
}
