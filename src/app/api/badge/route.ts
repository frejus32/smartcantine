import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { encoderBadge } from "@/lib/qr/badge";

/**
 * Génère le QR signé d'un élève. La clé PRIVÉE reste côté serveur.
 * L'appelant doit être authentifié et l'élève appartenir à son établissement
 * (garanti par la RLS : la lecture échoue sinon).
 */
export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId requis" }, { status: 400 });
  }

  const clePrivee = process.env.QR_SIGNING_PRIVATE_KEY;
  if (!clePrivee) {
    return NextResponse.json({ error: "Signature non configurée" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: eleve, error } = await supabase
    .from("eleves")
    .select("id, etablissement_id")
    .eq("id", studentId)
    .single();
  if (error || !eleve) {
    return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
  }

  const badge = encoderBadge({ schoolId: eleve.etablissement_id, studentId: eleve.id }, clePrivee);
  const qr = await QRCode.toDataURL(badge, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  return NextResponse.json({ qr });
}
