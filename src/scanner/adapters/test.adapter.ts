import type { ScannerAdapter } from "@/scanner/adapters/scanner-adapter";

/**
 * Couture E2E : les tests poussent des textes de QR dans window.__SC_TEST_QR__,
 * l'adaptateur les émet comme s'ils venaient de la caméra.
 */
export function coutureQrActive(): boolean {
  return Array.isArray((globalThis as Record<string, unknown>).__SC_TEST_QR__);
}

export function creerAdapterTest(): ScannerAdapter {
  let actif = false;
  let suspendu = false;
  let boucle: number | null = null;

  return {
    nom: "test",
    async demarrer(_video, onDetection) {
      actif = true;
      const consommer = () => {
        if (!actif) return;
        const file = (globalThis as Record<string, unknown>).__SC_TEST_QR__ as string[];
        if (!suspendu && file.length > 0) {
          const texte = file.shift();
          if (texte) onDetection(texte);
        }
        boucle = window.setTimeout(consommer, 100);
      };
      consommer();
    },
    suspendre() {
      suspendu = true;
    },
    reprendre() {
      suspendu = false;
    },
    arreter() {
      actif = false;
      if (boucle !== null) window.clearTimeout(boucle);
    },
  };
}
