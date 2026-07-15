import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/features/settings/settings-form";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Configuration de l'établissement, règles de cantine et gestion de l'équipe."
      />
      <SettingsForm />
    </>
  );
}
