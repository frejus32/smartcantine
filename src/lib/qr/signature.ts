import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";

/**
 * Signature Ed25519 des badges — Sprint 3B.
 * Asymétrique par conception : la clé PRIVÉE (serveur uniquement) signe à la
 * génération du badge ; les postes de scan n'embarquent que la clé PUBLIQUE,
 * qui permet de vérifier hors-ligne sans jamais pouvoir forger un badge.
 */

ed.hashes.sha512 = (...m) => sha512(ed.etc.concatBytes(...m));

const encodeur = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binaire = "";
  for (const b of bytes) binaire += String.fromCharCode(b);
  const b64 = typeof btoa === "function" ? btoa(binaire) : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(texte: string): Uint8Array {
  const b64 = texte.replace(/-/g, "+").replace(/_/g, "/");
  const binaire =
    typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) bytes[i] = binaire.charCodeAt(i);
  return bytes;
}

/** Signe un message (serveur uniquement — nécessite la clé privée hex). */
export function signerMessage(message: string, clePriveeHex: string): string {
  const signature = ed.sign(encodeur.encode(message), ed.etc.hexToBytes(clePriveeHex));
  return base64UrlEncode(signature);
}

/** Vérifie une signature avec la clé publique hex. Ne lève jamais : true/false. */
export function verifierSignature(
  message: string,
  signatureB64Url: string,
  clePubliqueHex: string,
): boolean {
  try {
    return ed.verify(
      base64UrlDecode(signatureB64Url),
      encodeur.encode(message),
      ed.etc.hexToBytes(clePubliqueHex),
    );
  } catch {
    return false;
  }
}
