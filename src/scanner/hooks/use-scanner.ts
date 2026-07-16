"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { creerScannerAdapter, type ScannerAdapter } from "@/scanner/adapters";
import {
  CameraError,
  fermerCamera,
  ouvrirMeilleureCamera,
  type ErreurCamera,
} from "@/scanner/services/camera.service";
import { jouerSon, preparerAudio } from "@/scanner/services/audio.service";
import { traiterScan } from "@/scanner/services/scan-pipeline";
import { transition, type EtatScanner, type EvenementScanner } from "@/scanner/types/machine";
import type { ResultatScan } from "@/scanner/types/resultat";

const DUREE_VERDICT_MS = 2600;
const DUREE_RETOUR_MS = 250;
const ANTI_REBOND_MS = 3000; // même badge ignoré pendant 3 s (élève qui re-présente)

type UseScannerRetour = {
  etat: EtatScanner;
  resultat: ResultatScan | null;
  erreurCamera: ErreurCamera | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  demarrer: () => void;
  reessayer: () => void;
};

/**
 * Orchestrateur du poste de scan. Toute la séquence passe par la machine à
 * états (transitions explicites) ; ce hook ne fait qu'exécuter les effets
 * de chaque état : caméra, adaptateur, pipeline, son, temporisations.
 */
export function useScanner(onResultat?: (r: ResultatScan) => void): UseScannerRetour {
  const [etat, dispatch] = useReducer(
    (e: EtatScanner, ev: EvenementScanner) => transition(e, ev),
    "idle",
  );
  const [resultat, setResultat] = useState<ResultatScan | null>(null);
  const [erreurCamera, setErreurCamera] = useState<ErreurCamera | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const adapterRef = useRef<ScannerAdapter | null>(null);
  const etatRef = useRef<EtatScanner>(etat);
  const dernierScan = useRef<{ texte: string; a: number }>({ texte: "", a: 0 });
  const enTraitement = useRef(false);
  const timers = useRef<number[]>([]);

  etatRef.current = etat;

  const planifier = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Étape 3→8 : un QR détecté par l'adaptateur. */
  const surDetection = useCallback(
    (texte: string) => {
      if (etatRef.current !== "scanning") return; // événement tardif : ignoré
      const maintenant = Date.now();
      if (
        texte === dernierScan.current.texte &&
        maintenant - dernierScan.current.a < ANTI_REBOND_MS
      )
        return;
      dernierScan.current = { texte, a: maintenant };

      dispatch({ type: "DETECTION" });
      adapterRef.current?.suspendre();
      enTraitement.current = true;

      void traiterScan(texte).then((res) => {
        if (!enTraitement.current) return; // scan annulé entre-temps (arrêt)
        enTraitement.current = false;
        setResultat(res);
        onResultat?.(res);

        if (res.source === "technique") {
          jouerSon("error");
          dispatch({ type: "ECHEC_TECHNIQUE" });
        } else if (res.source === "badge") {
          jouerSon("error");
          dispatch({ type: "VERDICT_ROUGE" });
        } else {
          const v = res.verdict.verdict;
          jouerSon(v === "vert" ? "success" : v === "orange" ? "warning" : "error");
          dispatch(
            v === "vert"
              ? { type: "VERDICT_VERT" }
              : v === "orange"
                ? { type: "VERDICT_ORANGE" }
                : { type: "VERDICT_ROUGE" },
          );
        }

        // Étape 12 : retour automatique au mode scan.
        planifier(() => dispatch({ type: "TEMPORISATION_FINIE" }), DUREE_VERDICT_MS);
      });
    },
    [onResultat, planifier],
  );

  /** Étapes 1-2 : caméra puis adaptateur. */
  const initialiser = useCallback(async () => {
    try {
      const stream = await ouvrirMeilleureCamera();
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        try {
          video.srcObject = stream;
          // Non bloquant : l'affichage du flux n'est pas une condition du pipeline
          // (un play() en attente ne doit jamais geler la machine à états).
          void video.play().catch(() => undefined);
        } catch {
          // flux de test ou lecture différée : la détection reste possible
        }
      }
      setErreurCamera(null);
      dispatch({ type: "CAMERA_PRETE" });

      const adapter = creerScannerAdapter();
      adapterRef.current = adapter;
      if (video) await adapter.demarrer(video, surDetection);
      dispatch({ type: "SCAN_ACTIF" });
    } catch (e) {
      setErreurCamera(e instanceof CameraError ? e.code : "camera_erreur");
      dispatch({ type: "CAMERA_ECHEC" });
    }
  }, [surDetection]);

  const demarrer = useCallback(() => {
    preparerAudio(); // le geste utilisateur autorise l'audio
    dispatch({ type: "DEMARRER" });
  }, []);

  const reessayer = useCallback(() => {
    setResultat(null);
    setErreurCamera(null);
    dispatch({ type: "REESSAYER" });
  }, []);

  // Effets d'état : chaque état déclenche exactement son effet.
  useEffect(() => {
    if (etat === "camera_initializing") void initialiser();
    if (etat === "scanning") adapterRef.current?.reprendre();
    if (etat === "returning") {
      planifier(() => {
        setResultat(null);
        dispatch({ type: "RETOUR_FINI" });
      }, DUREE_RETOUR_MS);
    }
    if (etat === "error" && erreurCamera === null) {
      // erreur technique passagère (moteur) : on revient scanner après le verdict
      planifier(() => dispatch({ type: "TEMPORISATION_FINIE" }), DUREE_VERDICT_MS);
    }
  }, [etat, erreurCamera, initialiser, planifier]);

  // Nettoyage complet au démontage.
  useEffect(() => {
    const minuteries = timers.current;
    return () => {
      enTraitement.current = false;
      minuteries.forEach((t) => window.clearTimeout(t));
      adapterRef.current?.arreter();
      fermerCamera(streamRef.current);
    };
  }, []);

  return { etat, resultat, erreurCamera, videoRef, demarrer, reessayer };
}
