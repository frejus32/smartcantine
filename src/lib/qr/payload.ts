import { z } from "zod";

/**
 * Structure du QR Code SmartCantine — Sprint 3.5 (structure seulement).
 * Contenu STRICTEMENT minimal : version, schoolId, studentId.
 * Tout le reste (nom, photo, solde, classe) vient de la base au moment du scan :
 * un badge n'embarque jamais de donnée périmable ni personnelle.
 *
 * Format texte : "SC1:<schoolId>:<studentId>"
 *   - "SC1" porte la version (v1) ;
 *   - le Sprint 3B ajoutera un 4e segment : la signature Ed25519
 *     ("SC1:<schoolId>:<studentId>:<signature>") — les décodeurs v1
 *     rejettent tout payload non conforme.
 */

export const QR_VERSION = 1 as const;
const PREFIXE = `SC${QR_VERSION}`;

const uuid = z.string().uuid();

export const qrPayloadSchema = z.object({
  version: z.literal(QR_VERSION),
  schoolId: uuid,
  studentId: uuid,
});

export type QrPayload = z.infer<typeof qrPayloadSchema>;

export class QrPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QrPayloadError";
  }
}

export function encodeQrPayload(input: { schoolId: string; studentId: string }): string {
  const payload = qrPayloadSchema.parse({ version: QR_VERSION, ...input });
  return `${PREFIXE}:${payload.schoolId}:${payload.studentId}`;
}

export function decodeQrPayload(texte: string): QrPayload {
  const segments = texte.trim().split(":");
  if (segments.length !== 3 || segments[0] !== PREFIXE) {
    throw new QrPayloadError("Ce QR code n'est pas un badge SmartCantine (v1).");
  }
  const result = qrPayloadSchema.safeParse({
    version: QR_VERSION,
    schoolId: segments[1],
    studentId: segments[2],
  });
  if (!result.success) {
    throw new QrPayloadError("Badge illisible : identifiants invalides.");
  }
  return result.data;
}
