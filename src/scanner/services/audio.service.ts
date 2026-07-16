/**
 * AudioService : trois signatures sonores synthétisées (Web Audio, zéro fichier).
 * Le contexte audio ne peut démarrer qu'après un geste utilisateur :
 * preparer() est appelé au clic « Activer la caméra ».
 */

export type SonVerdict = "success" | "warning" | "error";

let contexte: AudioContext | null = null;

export function preparerAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    contexte ??= new Ctor();
    if (contexte.state === "suspended") void contexte.resume();
  } catch {
    contexte = null; // le scan fonctionne sans son
  }
}

function bip(
  ctx: AudioContext,
  debut: number,
  frequence: number,
  duree: number,
  forme: OscillatorType,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = forme;
  osc.frequency.value = frequence;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + debut);
  gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + debut + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + debut + duree);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + debut);
  osc.stop(ctx.currentTime + debut + duree + 0.05);
}

export function jouerSon(son: SonVerdict): void {
  if (!contexte || contexte.state !== "running") return;
  switch (son) {
    case "success": // deux notes ascendantes brèves
      bip(contexte, 0, 880, 0.12, "sine");
      bip(contexte, 0.13, 1320, 0.16, "sine");
      break;
    case "warning": // une note médiane tenue
      bip(contexte, 0, 620, 0.35, "triangle");
      break;
    case "error": // deux notes graves insistantes
      bip(contexte, 0, 220, 0.18, "square");
      bip(contexte, 0.22, 190, 0.26, "square");
      break;
  }
}
