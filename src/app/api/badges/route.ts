import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { encoderBadge } from "@/lib/qr/badge";
import { uuidSchema } from "@/lib/validation";

/**
 * Génère les QR signés d'un lot d'élèves (par classe ou toute l'école).
 * La clé privée reste serveur ; la RLS borne la lecture à l'établissement.
 */
export async function GET(request: NextRequest) {
  const classeIdBrut = request.nextUrl.searchParams.get("classeId");
  if (classeIdBrut && !uuidSchema.safeParse(classeIdBrut).success) {
    return NextResponse.json({ error: "classeId invalide" }, { status: 400 });
  }
  const classeId = classeIdBrut;
  const clePrivee = process.env.QR_SIGNING_PRIVATE_KEY;
  if (!clePrivee) return NextResponse.json({ error: "Signature non configurée" }, { status: 500 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let requete = supabase
    .from("eleves_detail")
    .select(
      "id, etablissement_id, matricule, nom, prenoms, classe_nom, classe_id, photo_path, statut",
    )
    .eq("statut", "actif")
    .order("nom");
  if (classeId) requete = requete.eq("classe_id", classeId);

  const { data: eleves, error } = await requete;
  if (error) {
    logger.error("badges: lecture eleves_detail echouee", { code: error.code ?? "?" });
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }

  const badges = await Promise.all(
    (eleves ?? []).map(async (e) => {
      const contenu = encoderBadge({ schoolId: e.etablissement_id, studentId: e.id }, clePrivee);
      const qr = await QRCode.toDataURL(contenu, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 220,
      });
      return {
        id: e.id,
        matricule: e.matricule,
        nom: e.nom,
        prenoms: e.prenoms,
        classe: e.classe_nom,
        photo_path: e.photo_path,
        qr,
      };
    }),
  );

  return NextResponse.json({ badges });
}
