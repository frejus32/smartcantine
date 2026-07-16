// Génère une paire Ed25519 pour signer les badges (hex).
// Usage : node scripts/qr-keygen.mjs
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
ed.hashes.sha512 = (...m) => sha512(ed.etc.concatBytes(...m));

const { secretKey, publicKey } = ed.keygen();
console.log("QR_SIGNING_PRIVATE_KEY=" + ed.etc.bytesToHex(secretKey));
console.log("NEXT_PUBLIC_QR_PUBLIC_KEY=" + ed.etc.bytesToHex(publicKey));
