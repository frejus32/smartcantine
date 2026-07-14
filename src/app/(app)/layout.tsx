import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import { roleFromMetadata } from "@/types/auth";

/**
 * Layout protégé : le middleware bloque déjà les non-connectés,
 * mais on revérifie côté serveur (défense en profondeur) pour obtenir le rôle.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = roleFromMetadata(user.app_metadata);
  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : (user.email ?? "Utilisateur");

  return (
    <div className="min-h-dvh">
      <Sidebar role={role} />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Header role={role} email={user.email ?? ""} displayName={displayName} />
        <main className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
