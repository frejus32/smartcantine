import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsContent } from "@/features/settings/settings-content";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Administration de l'établissement, cantine, calendrier, utilisateurs et sécurité."
      />
      <SettingsContent />
    </>
  );
}
