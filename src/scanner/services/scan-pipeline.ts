import { env } from "@/config/env";
import { decoderBadge } from "@/lib/qr/badge";
import { QrPayloadError } from "@/lib/qr/payload";
import { enregistrerPassage, photoEleve } from "@/services/moteur.service";
import type { ResultatScan } from "@/scanner/types/resultat";

/**
 * Pipeline d'un scan (étapes 4 à 8 du contrat de sprint) :
 * texte QR -> format v1 -> signature Ed25519 -> studentId -> moteur -> ScanVerdict.
 * AUCUNE décision métier ici : les refus viennent du moteur ; le pipeline ne
 * rejette que ce qui n'est pas un badge authentique.
 */
export async function traiterScan(texteQr: string): Promise<ResultatScan> {
  let studentId: string;
  try {
    const payload = decoderBadge(texteQr, env.NEXT_PUBLIC_QR_PUBLIC_KEY);
    studentId = payload.studentId;
  } catch (e) {
    if (e instanceof QrPayloadError) {
      const signature = e.message.toLowerCase().includes("signature");
      return {
        source: "badge",
        code: signature ? "signature_invalide" : "qr_invalide",
        message: e.message,
      };
    }
    return { source: "badge", code: "qr_invalide", message: "QR code illisible." };
  }

  try {
    const verdict = await enregistrerPassage(studentId);
    if (verdict.verdict !== "rouge") {
      const photo = await photoEleve(studentId);
      if (photo) verdict.photo_path = photo;
    }
    return { source: "moteur", verdict };
  } catch (e) {
    return {
      source: "technique",
      message: e instanceof Error ? e.message : "Le moteur est injoignable. Vérifiez la connexion.",
    };
  }
}
