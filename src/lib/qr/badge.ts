import { decodeQrPayload, encodeQrPayload, QrPayloadError, type QrPayload } from "@/lib/qr/payload";
import { signerMessage, verifierSignature } from "@/lib/qr/signature";

/**
 * Badge signé — LE format imprimé sur les QR codes :
 *   "SC1:<schoolId>:<studentId>:<signature-ed25519-base64url>"
 * Le message signé est exactement le payload v1 non signé (3 segments).
 * Un badge sans signature valide n'existe pas pour le scanner.
 */

export function encoderBadge(
  input: { schoolId: string; studentId: string },
  clePriveeHex: string,
): string {
  const payload = encodeQrPayload(input);
  return `${payload}:${signerMessage(payload, clePriveeHex)}`;
}

export function decoderBadge(texte: string, clePubliqueHex: string): QrPayload {
  const propre = texte.trim();
  const derniereColonne = propre.lastIndexOf(":");
  const segments = propre.split(":");
  if (segments.length !== 4) {
    throw new QrPayloadError("Ce QR code n'est pas un badge SmartCantine.");
  }
  const message = propre.slice(0, derniereColonne);
  const signature = propre.slice(derniereColonne + 1);
  const payload = decodeQrPayload(message); // valide format + version + UUID
  if (!signature || !verifierSignature(message, signature, clePubliqueHex)) {
    throw new QrPayloadError("Signature invalide — badge falsifié ou illisible.");
  }
  return payload;
}
