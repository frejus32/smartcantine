import { redirect } from "next/navigation";

/** Le middleware redirige déjà selon le rôle ; ceci est un filet de sécurité. */
export default function RootPage() {
  redirect("/dashboard");
}
