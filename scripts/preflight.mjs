#!/usr/bin/env node
// Vérification pré-déploiement : exécute les portes de qualité et résume.
// Usage : node scripts/preflight.mjs
import { execSync } from "node:child_process";

const etapes = [
  ["Typecheck", "npm run typecheck"],
  ["Lint", "npm run lint"],
  ["Tests unitaires", "npm run test:unit"],
  ["Build", "npm run build"],
];

let echec = false;
for (const [nom, cmd] of etapes) {
  process.stdout.write(`▶ ${nom}… `);
  try {
    execSync(cmd, { stdio: "pipe" });
    console.log("✓");
  } catch {
    console.log("✗ ÉCHEC");
    echec = true;
  }
}

console.log(
  echec
    ? "\n✗ Des vérifications ont échoué. Corrigez avant de déployer."
    : "\n✓ Toutes les vérifications applicatives passent.\n  Pensez aussi aux tests SQL (voir docs) et à la checklist de DEPLOYMENT.md.",
);
process.exit(echec ? 1 : 0);
