import {
  barcodeDetectorDisponible,
  creerAdapterBarcodeDetector,
} from "@/scanner/adapters/barcode-detector.adapter";
import { creerAdapterZxing } from "@/scanner/adapters/zxing.adapter";
import { coutureQrActive, creerAdapterTest } from "@/scanner/adapters/test.adapter";
import type { ScannerAdapter } from "@/scanner/adapters/scanner-adapter";

/** Sélection automatique : natif si disponible (Chrome/Edge/Android), sinon ZXing (Safari). */
export function creerScannerAdapter(): ScannerAdapter {
  if (coutureQrActive()) return creerAdapterTest();
  if (barcodeDetectorDisponible()) return creerAdapterBarcodeDetector();
  return creerAdapterZxing();
}

export type { ScannerAdapter } from "@/scanner/adapters/scanner-adapter";
