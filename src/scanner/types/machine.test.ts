import { describe, expect, it } from "vitest";
import { transition, type EtatScanner, type EvenementScanner } from "@/scanner/types/machine";

const t = (etat: EtatScanner, type: EvenementScanner["type"]) =>
  transition(etat, { type } as EvenementScanner);

describe("machine à états du scanner", () => {
  it("suit le pipeline nominal : idle -> ... -> scanning -> verdict -> retour -> scanning", () => {
    expect(t("idle", "DEMARRER")).toBe("camera_initializing");
    expect(t("camera_initializing", "CAMERA_PRETE")).toBe("camera_ready");
    expect(t("camera_ready", "SCAN_ACTIF")).toBe("scanning");
    expect(t("scanning", "DETECTION")).toBe("processing");
    expect(t("processing", "VERDICT_VERT")).toBe("authorized");
    expect(t("authorized", "TEMPORISATION_FINIE")).toBe("returning");
    expect(t("returning", "RETOUR_FINI")).toBe("scanning");
  });

  it("mappe chaque verdict sur son état d'affichage", () => {
    expect(t("processing", "VERDICT_VERT")).toBe("authorized");
    expect(t("processing", "VERDICT_ORANGE")).toBe("warning");
    expect(t("processing", "VERDICT_ROUGE")).toBe("denied");
    expect(t("processing", "ECHEC_TECHNIQUE")).toBe("error");
  });

  it("gère les échecs caméra et la relance", () => {
    expect(t("camera_initializing", "CAMERA_ECHEC")).toBe("error");
    expect(t("scanning", "CAMERA_ECHEC")).toBe("error");
    expect(t("error", "REESSAYER")).toBe("camera_initializing");
  });

  it("ignore les événements hors table (protection contre les événements tardifs)", () => {
    expect(t("idle", "DETECTION")).toBe("idle");
    expect(t("authorized", "DETECTION")).toBe("authorized");
    expect(t("scanning", "VERDICT_VERT")).toBe("scanning");
    expect(t("returning", "DETECTION")).toBe("returning");
  });

  it("ARRETER ramène à idle depuis tous les états", () => {
    const etats: EtatScanner[] = [
      "camera_initializing",
      "camera_ready",
      "scanning",
      "processing",
      "authorized",
      "denied",
      "warning",
      "error",
      "returning",
    ];
    for (const e of etats) expect(t(e, "ARRETER")).toBe("idle");
  });
});
