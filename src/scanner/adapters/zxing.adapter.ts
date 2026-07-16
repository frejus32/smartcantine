import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import type { ScannerAdapter } from "@/scanner/adapters/scanner-adapter";

/** Repli universel (Safari / iPhone notamment) : décodage ZXing en continu. */
export function creerAdapterZxing(): ScannerAdapter {
  const lecteur = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 150 });
  let controles: IScannerControls | null = null;
  let suspendu = false;

  return {
    nom: "zxing",
    async demarrer(video, onDetection) {
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
      controles?.stop();
      controles = null;
    },
  };
}
