import type { ScannerAdapter } from "@/scanner/adapters/scanner-adapter";

/**
 * Repli universel (Safari / iPhone notamment) : décodage ZXing en continu.
 * @zxing/browser (~200 Ko) est chargé à la demande, uniquement sur les
 * navigateurs sans BarcodeDetector natif — il n'entre pas dans le bundle initial.
 */
export function creerAdapterZxing(): ScannerAdapter {
  let controles: { stop: () => void } | null = null;
  let suspendu = false;
  let arrete = false;

  return {
    nom: "zxing",
    async demarrer(video, onDetection) {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (arrete) return; // arrêté pendant le chargement
      const lecteur = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 150 });
      controles = await lecteur.decodeFromVideoElement(video, (resultat) => {
        if (!suspendu && resultat) onDetection(resultat.getText());
      });
    },
    suspendre() {
      suspendu = true;
    },
    reprendre() {
      suspendu = false;
    },
    arreter() {
      arrete = true;
      controles?.stop();
      controles = null;
    },
  };
}
