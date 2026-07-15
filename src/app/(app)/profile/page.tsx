import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileView } from "@/features/profile/profile-view";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Mon profil"
        description="Vos informations personnelles et votre sécurité."
      />
      <ProfileView />
    </>
  );
}
