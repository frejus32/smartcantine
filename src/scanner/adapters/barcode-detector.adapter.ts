import type { ScannerAdapter } from "@/scanner/adapters/scanner-adapter";

type BarcodeDetectorResultat = { rawValue: string };
type BarcodeDetectorNatif = {
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResultat[]>;
};
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorNatif;

export function barcodeDetectorDisponible(): boolean {
  return typeof (globalThis as Record<string, unknown>).BarcodeDetector === "function";
}

/** Détection native (Chrome, Edge, Android) : rapide et sobre en batterie. */
export function creerAdapterBarcodeDetector(): ScannerAdapter {
  const Ctor = (globalThis as Record<string, unknown>).BarcodeDetector as BarcodeDetectorCtor;
  const detecteur = new Ctor({ formats: ["qr_code"] });
  let actif = false;
  let suspendu = false;
  let boucle: number | null = null;

  return {
    nom: "barcode-detector",
    async demarrer(video, onDetection) {
      actif = true;
      const analyser = async () => {
        if (!actif) return;
        if (!suspendu && video.readyState >= 2) {
          try {
            const codes = await detecteur.detect(video);
            if (codes.length > 0 && codes[0].rawValue) onDetection(codes[0].rawValue);
          } catch {
            // frame illisible : on continue
          }
        }
        boucle = window.setTimeout(analyser, 120);
      };
      void analyser();
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
