import { createClient } from "@/lib/supabase/client";
import { roleFromMetadata, type Role } from "@/types/auth";

export type SignInResult = { ok: true; role: Role } | { ok: false; message: string };

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "Email ou mot de passe incorrect."
        : "Connexion impossible. Vérifiez votre réseau puis réessayez.";
    return { ok: false, message };
  }
  return { ok: true, role: roleFromMetadata(data.user.app_metadata) };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
