import { describe, expect, it } from "vitest";
import { encoderBadge, decoderBadge } from "@/lib/qr/badge";
import { QrPayloadError } from "@/lib/qr/payload";
import { signerMessage } from "@/lib/qr/signature";

// Paire de clés de test (générée pour cette suite uniquement).
const PRIV = "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60";
const PRIV2 = "4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
ed.hashes.sha512 = (...m) => sha512(ed.etc.concatBytes(...m));
const PUB = ed.etc.bytesToHex(ed.getPublicKey(ed.etc.hexToBytes(PRIV)));

const SID = "11111111-1111-4111-8111-111111111111";
const EID = "22222222-2222-4222-8222-222222222222";

describe("badge signé Ed25519", () => {
  it("aller-retour : encode puis décode+vérifie", () => {
    const badge = encoderBadge({ schoolId: EID, studentId: SID }, PRIV);
    expect(badge.startsWith(`SC1:${EID}:${SID}:`)).toBe(true);
    const payload = decoderBadge(badge, PUB);
    expect(payload).toEqual({ version: 1, schoolId: EID, studentId: SID });
  });

  it("rejette un badge falsifié (studentId modifié, signature conservée)", () => {
    const badge = encoderBadge({ schoolId: EID, studentId: SID }, PRIV);
    const sig = badge.split(":")[3];
    const falsifie = `SC1:${EID}:33333333-3333-4333-8333-333333333333:${sig}`;
    expect(() => decoderBadge(falsifie, PUB)).toThrow(QrPayloadError);
  });

  it("rejette un badge signé avec une AUTRE clé privée", () => {
    const message = `SC1:${EID}:${SID}`;
    const mauvaiseSig = signerMessage(message, PRIV2);
    expect(() => decoderBadge(`${message}:${mauvaiseSig}`, PUB)).toThrow(/Signature invalide/);
  });

  it("rejette les formats non-badge : payload nu, URL, bruit", () => {
    for (const txt of [
      `SC1:${EID}:${SID}`,
      "https://evil.example/x",
      "bonjour",
      `SC2:${EID}:${SID}:abc`,
    ]) {
      expect(() => decoderBadge(txt, PUB)).toThrow(QrPayloadError);
    }
  });
});
