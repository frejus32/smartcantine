/**
 * Contrat des adaptateurs de détection QR — prévu au dossier d'architecture :
 * le poste ne dépend jamais d'une bibliothèque de scan en particulier.
 */
export type ScannerAdapter = {
  /** Démarre la détection sur l'élément vidéo. onDetection est appelé à chaque lecture. */
  demarrer(video: HTMLVideoElement, onDetection: (texte: string) => void): Promise<void>;
  /** Suspend la détection (verdict affiché) sans couper la caméra. */
  suspendre(): void;
  /** Reprend la détection. */
  reprendre(): void;
  /** Arrêt définitif et libération des ressources. */
  arreter(): void;
  readonly nom: string;
};
