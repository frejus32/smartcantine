import type { Metadata } from "next";
import { User } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Profil" };

export default function Page() {
  return (
    <>
      <PageHeader title="Profil" description="Vos informations personnelles et votre session." />
      <EmptyState
        icon={User}
        title="Module en préparation"
        description="La gestion du profil sera complétée lors des prochains sprints."
      />
    </>
  );
}
