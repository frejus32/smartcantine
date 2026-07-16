"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  Hand,
  Maximize,
  Minimize,
  ScanLine,
  ShieldX,
  WifiOff,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { env } from "@/config/env";
import { VERDICT_META, detailVerdict } from "@/lib/scan/verdict";
import { useScanner } from "@/scanner/hooks/use-scanner";
import { MESSAGES_CAMERA } from "@/scanner/services/camera.service";
import { estEtatVerdict } from "@/scanner/types/machine";
import type { EntreeHistorique, ResultatScan } from "@/scanner/types/resultat";
import { listerClasses } from "@/services/moteur.service";
import { getInitials } from "@/utils/initials";
import { cn } from "@/lib/utils";

const ICONES_VERDICT = { vert: Check, orange: AlertTriangle, rouge: Hand } as const;

function resultatVersHistorique(r: ResultatScan): EntreeHistorique {
  const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const id = "h" + Date.now() + Math.random().toString(36).slice(2, 6);
  if (r.source === "moteur") {
    return {
      id,
      heure,
      titre: r.verdict.eleve ?? "Élève",
      detail: detailVerdict(r.verdict),
      verdict: r.verdict.verdict,
    };
  }
  if (r.source === "badge") {
    return {
      id,
      heure,
      titre: r.code === "signature_invalide" ? "Badge falsifié" : "QR non reconnu",
      detail: r.message,
      verdict: "rouge",
    };
  }
  return { id, heure, titre: "Incident technique", detail: r.message, verdict: "rouge" };
}

export function ScanScreen() {
  const [historique, setHistorique] = useState<EntreeHistorique[]>([]);
  const [classes, setClasses] = useState<Record<string, string>>({});
  const [pleinEcran, setPleinEcran] = useState(false);

  const surResultat = useCallback((r: ResultatScan) => {
    setHistorique((h) => [resultatVersHistorique(r), ...h.slice(0, 9)]);
  }, []);

  const { etat, resultat, erreurCamera, videoRef, demarrer, reessayer } = useScanner(surResultat);

  useEffect(() => {
    listerClasses()
      .then((liste) => setClasses(Object.fromEntries(liste.map((c) => [c.id, c.nom]))))
      .catch(() => setClasses({}));
  }, []);

  useEffect(() => {
    const onChange = () => setPleinEcran(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function basculerPleinEcran() {
    const conteneur = document.getElementById("poste-de-scan");
    if (document.fullscreenElement) void document.exitFullscreen();
    else void conteneur?.requestFullscreen?.();
  }

  const enVerdict = estEtatVerdict(etat) || (etat === "error" && erreurCamera === null);

  return (
    <div className="space-y-4">
      {env.NEXT_PUBLIC_DEMO_MODE ? (
        <div
          role="alert"
          className="border-warning bg-warning-soft flex items-start gap-3 rounded-lg border-l-4 p-4"
        >
          <WifiOff className="text-warning mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm">
            <span className="font-semibold">Mode démonstration : moteur non connecté.</span> La
            caméra et la lecture des badges fonctionnent, mais le verdict nécessite un projet
            Supabase (voir README).
          </p>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-5">
        {/* ------------------------------ Poste de scan ------------------------------ */}
        <div
          id="poste-de-scan"
          data-etat={etat}
          className="bg-foreground text-background relative flex min-h-[560px] flex-col overflow-hidden rounded-xl lg:col-span-3"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-background/80 flex items-center gap-2 text-sm font-medium">
              <ScanLine className="size-4" aria-hidden />
              Poste 1 — Service du déjeuner
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={basculerPleinEcran}
              className="text-background/70 hover:text-background hover:bg-white/10"
              aria-label={pleinEcran ? "Quitter le plein écran" : "Passer en plein écran"}
            >
              {pleinEcran ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
            </Button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-8">
            {etat === "idle" ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
                  <Camera className="size-8" aria-hidden />
                </div>
                <p className="text-background/70 max-w-xs">
                  Le poste est prêt. La caméra démarre après votre autorisation.
                </p>
                <Button size="lg" onClick={demarrer}>
                  <Camera aria-hidden /> Activer la caméra
                </Button>
              </div>
            ) : erreurCamera !== null ? (
              <div className="flex flex-col items-center gap-4 text-center" role="alert">
                <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
                  <ShieldX className="text-destructive size-8" aria-hidden />
                </div>
                <p className="text-xl font-bold">{MESSAGES_CAMERA[erreurCamera].titre}</p>
                <p className="text-background/70 max-w-xs text-sm">
                  {MESSAGES_CAMERA[erreurCamera].detail}
                </p>
                <Button size="lg" variant="secondary" onClick={reessayer}>
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                {/* Viseur */}
                <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-black/40">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="size-full object-cover"
                    aria-label="Flux caméra du poste de scan"
                  />
                  {(
                    [
                      "top-2 left-2 border-t-2 border-l-2 rounded-tl-lg",
                      "top-2 right-2 border-t-2 border-r-2 rounded-tr-lg",
                      "bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg",
                      "bottom-2 right-2 border-b-2 border-r-2 rounded-br-lg",
                    ] as const
                  ).map((pos) => (
                    <span
                      key={pos}
                      className={cn("border-primary-hover absolute size-10", pos)}
                      aria-hidden
                    />
                  ))}
                </div>
                <p
                  className="text-background/70 flex items-center gap-2 text-sm font-medium"
                  aria-live="polite"
                >
                  {etat === "camera_initializing" || etat === "camera_ready" ? (
                    <>
                      <Spinner className="size-4" /> Démarrage de la caméra…
                    </>
                  ) : etat === "processing" ? (
                    <>
                      <Spinner className="size-4" /> Vérification du badge…
                    </>
                  ) : (
                    <>
                      <ScanLine className="size-4 animate-pulse" aria-hidden />
                      Présentez un badge devant la caméra
                    </>
                  )}
                </p>
              </>
            )}
          </div>

          {/* --------------------- Verdict pleine page (étape 9) --------------------- */}
          {enVerdict && resultat ? (
            <VerdictPleinePage resultat={resultat} classes={classes} />
          ) : null}
        </div>

        {/* ------------------------------- Historique ------------------------------- */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Derniers passages</CardTitle>
            <Badge variant="neutral">Session en cours</Badge>
          </CardHeader>
          <CardContent className="divide-y">
            {historique.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Les scans de cette session s&apos;afficheront ici.
              </p>
            ) : (
              historique.map((h) => (
                <div key={h.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      h.verdict === "vert"
                        ? "bg-success"
                        : h.verdict === "orange"
                          ? "bg-warning"
                          : "bg-destructive",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.titre}</p>
                    <p className="text-muted-foreground truncate text-xs">{h.detail}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {h.heure}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Le verdict EST l'écran : couleur pleine, photo, nom, classe, heure, solde, LE mot. */
function VerdictPleinePage({
  resultat,
  classes,
}: {
  resultat: ResultatScan;
  classes: Record<string, string>;
}) {
  const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (resultat.source === "moteur") {
    const v = resultat.verdict;
    const meta = VERDICT_META[v.verdict];
    const Icone = ICONES_VERDICT[v.verdict];
    return (
      <div
        data-testid="verdict-plein-ecran"
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center text-white",
          meta.fond,
        )}
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-white/15">
          <Icone className="size-9" strokeWidth={2.5} aria-hidden />
        </div>
        {v.eleve ? (
          <Avatar className="size-28 border-4 border-white/40">
            {v.photo_path ? (
              <AvatarImage src={`/api/photo?path=${encodeURIComponent(v.photo_path)}`} alt="" />
            ) : null}
            <AvatarFallback className="bg-white/20 text-3xl font-bold text-white">
              {getInitials(v.eleve)}
            </AvatarFallback>
          </Avatar>
        ) : null}
        <div className="space-y-1">
          {v.eleve ? <p className="text-3xl font-bold sm:text-4xl">{v.eleve}</p> : null}
          <p className="text-lg font-semibold text-white/85">
            {(v.classe_id && classes[v.classe_id]) ?? "—"} · {heure}
          </p>
        </div>
        <p className="text-4xl font-extrabold tracking-wide sm:text-5xl">{meta.mot}</p>
        <p className="text-sm font-medium text-white/90">{detailVerdict(v)}</p>
        <BarreTemporisation />
      </div>
    );
  }

  const estTechnique = resultat.source === "technique";
  return (
    <div
      data-testid="verdict-plein-ecran"
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center text-white",
        estTechnique ? "bg-foreground" : "bg-destructive",
      )}
      role="alert"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-white/15">
        {estTechnique ? (
          <WifiOff className="size-9" aria-hidden />
        ) : (
          <ShieldX className="size-9" strokeWidth={2.5} aria-hidden />
        )}
      </div>
      <p className="text-4xl font-extrabold tracking-wide sm:text-5xl">
        {estTechnique ? "INCIDENT" : "BADGE INVALIDE"}
      </p>
      <p className="max-w-sm text-sm font-medium text-white/90">{resultat.message}</p>
      <p className="text-sm text-white/70">{heure}</p>
      <BarreTemporisation />
    </div>
  );
}

function BarreTemporisation() {
  return (
    <>
      <span
        className="absolute bottom-0 left-0 h-1 animate-[verdict-timer_2.6s_linear_forwards] bg-white/50"
        aria-hidden
      />
      <style>{"@keyframes verdict-timer { from { width: 100% } to { width: 0% } }"}</style>
    </>
  );
}
