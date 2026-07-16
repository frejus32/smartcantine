import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Proxifie une photo privée via URL signée courte durée (accès borné par la RLS Storage). */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path requis" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase.storage.from("photos-eleves").createSignedUrl(path, 3600);
  if (error || !data) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });

  return NextResponse.redirect(data.signedUrl);
}
