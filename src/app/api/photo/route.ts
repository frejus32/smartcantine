import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { storagePathSchema } from "@/lib/validation";

/**
 * Proxifie une photo privée via URL signée courte durée.
 * Double barrière : validation de forme du chemin ici + RLS Storage
 * (le chemin doit commencer par l'établissement de l'utilisateur).
 */
export async function GET(request: NextRequest) {
  const brut = request.nextUrl.searchParams.get("path");
  const parse = storagePathSchema.safeParse(brut);
  if (!parse.success) return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase.storage
    .from("photos-eleves")
    .createSignedUrl(parse.data, 3600);
  if (error || !data) {
    logger.warn("photo: URL signee impossible");
    return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
