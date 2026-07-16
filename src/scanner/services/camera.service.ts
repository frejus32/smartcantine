/**
 * Service caméra : accès, sélection de la meilleure caméra, arrêt propre.
 * Aucune logique métier. Erreurs mappées en codes stables pour la machine.
 */

export type ErreurCamera = "camera_refusee" | "camera_indisponible" | "camera_erreur";

export class CameraError extends Error {
  constructor(public code: ErreurCamera) {
    super(code);
    this.name = "CameraError";
  }
}

export const MESSAGES_CAMERA: Record<ErreurCamera, { titre: string; detail: string }> = {
  camera_refusee: {
    titre: "Accès caméra refusé",
    detail: "Autorisez la caméra dans les réglages du navigateur, puis réessayez.",
  },
  camera_indisponible: {
    titre: "Aucune caméra détectée",
    detail: "Branchez ou activez une caméra sur ce poste, puis réessayez.",
  },
  camera_erreur: {
    titre: "Caméra indisponible",
    detail: "La caméra est peut-être utilisée par une autre application.",
  },
};

/** Couture E2E : window.__SC_TEST_CAMERA__ = "ok" | "refusee" | "indisponible". */
function coutureTest(): "ok" | "refusee" | "indisponible" | undefined {
  return (globalThis as Record<string, unknown>).__SC_TEST_CAMERA__ as
    "ok" | "refusee" | "indisponible" | undefined;
}

function mapperErreur(e: unknown): CameraError {
  const nom = (e as { name?: string })?.name ?? "";
  if (nom === "NotAllowedError" || nom === "SecurityError")
    return new CameraError("camera_refusee");
  if (nom === "NotFoundError" || nom === "OverconstrainedError")
    return new CameraError("camera_indisponible");
  return new CameraError("camera_erreur");
}

/**
 * Ouvre la meilleure caméra : priorité à la caméra arrière (postes mobiles),
 * repli sur la caméra par défaut (webcams de postes fixes).
 */
export async function ouvrirMeilleureCamera(): Promise<MediaStream> {
  const test = coutureTest();
  if (test === "refusee") throw new CameraError("camera_refusee");
  if (test === "indisponible") throw new CameraError("camera_indisponible");
  if (test === "ok") return new MediaStream();

  if (!navigator.mediaDevices?.getUserMedia) throw new CameraError("camera_indisponible");

  try {
    // facingMode "environment" en simple préférence : Safari iOS l'honore,
    // les postes fixes sans caméra arrière retombent sur leur webcam.
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  } catch (e) {
    throw mapperErreur(e);
  }
}

export function fermerCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}
