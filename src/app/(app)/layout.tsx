import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import { roleFromMetadata, type Role } from "@/types/auth";
import { env } from "@/config/env";

/**
 * Layout protégé : le middleware bloque déjà les non-connectés,
 * mais on revérifie côté serveur (défense en profondeur) pour obtenir le rôle.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (env.NEXT_PUBLIC_DEMO_MODE) {
    return (
      <AppShell role="admin" email="demo@smartcantine.ci" displayName="Awa Yao">
        {children}
      </AppShell>
    );
  }

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
    <AppShell role={role} email={user.email ?? ""} displayName={displayName}>
      {children}
    </AppShell>
  );
}

function AppShell({
  role,
  email,
  displayName,
  children,
}: {
  role: Role;
  email: string;
  displayName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <Sidebar role={role} />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Header role={role} email={email} displayName={displayName} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="animate-enter mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
