"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Hand, ScanLine, Wifi } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ELEVES, MOCK_SCANS, type MockScan } from "@/lib/mock/data";
import { getInitials } from "@/utils/initials";
import { cn } from "@/lib/utils";

type Verdict = "vert" | "rouge" | "orange";

type ScanResultat = {
  verdict: Verdict;
  nom: string;
  classe: string;
  detail: string;
};

const VERDICTS: Record<
  Verdict,
  {
    fond: string;
    mot: string;
    icone: typeof Check;
    badge: "success" | "danger" | "warning";
    label: string;
  }
> = {
  vert: { fond: "bg-success", mot: "SERVIR", icone: Check, badge: "success", label: "Servi" },
  rouge: { fond: "bg-destructive", mot: "REFUSER", icone: Hand, badge: "danger", label: "Refusé" },
  orange: {
    fond: "bg-warning",
    mot: "À RÉGULARISER",
    icone: AlertTriangle,
    badge: "warning",
    label: "À régulariser",
  },
};

const CLASSES: Record<string, string> = {
  c1: "Petite Section A",
  c2: "CM2 B",
  c3: "5e Rubis",
  c4: "3e Diamant",
};

/** Scénarios de démonstration cyclés dans l'ordre : vert, vert, rouge, orange. */
const SCENARIO: Array<{ verdict: Verdict; eleveIdx: number; detail: string }> = [
  { verdict: "vert", eleveIdx: 6, detail: "Solde restant : 18 repas" },
  { verdict: "vert", eleveIdx: 10, detail: "Solde restant : 14 repas" },
  { verdict: "rouge", eleveIdx: 6, detail: "Déjà servi à 12:07" },
  { verdict: "orange", eleveIdx: 14, detail: "Solde épuisé — paramètre école : servir avec dette" },
];

const DUREE_VERDICT_MS = 2600;

export function ScannerDemo() {
  const [resultat, setResultat] = useState<ScanResultat | null>(null);
  const [historique, setHistorique] = useState<MockScan[]>(MOCK_SCANS);
  const etape = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const simuler = useCallback((force?: Verdict) => {
    const scenario = force
      ? (SCENARIO.find((s) => s.verdict === force) ?? SCENARIO[0])
      : SCENARIO[etape.current % SCENARIO.length];
    if (!force) etape.current += 1;

    const eleve = MOCK_ELEVES[scenario.eleveIdx];
    const nom = eleve.prenoms + " " + eleve.nom;
    setResultat({
      verdict: scenario.verdict,
      nom,
      classe: CLASSES[eleve.classeId],
      detail: scenario.detail,
    });
    setHistorique((h) => [
      {
        id: "s" + Date.now(),
        heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        eleve,
        verdict: scenario.verdict,
        detail: scenario.detail,
      },
      ...h.slice(0, 7),
    ]);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setResultat(null), DUREE_VERDICT_MS);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* ------------------------------ Poste de scan ------------------------------ */}
      <div className="bg-foreground text-background relative overflow-hidden rounded-xl lg:col-span-3">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-background/80 flex items-center gap-2 text-sm font-medium">
            <ScanLine className="size-4" aria-hidden />
            Poste 1 — Service du déjeuner
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
            <Wifi className="text-success size-3.5" aria-hidden /> En ligne
          </span>
        </div>

        <div className="flex flex-col items-center gap-6 px-6 pt-4 pb-8">
          {/* Viseur caméra (placeholder — la caméra réelle arrive au sprint Scanner) */}
          <div className="relative aspect-square w-full max-w-xs">
            <div className="absolute inset-0 rounded-xl border-2 border-dashed border-white/20" />
            {(
              [
                "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
                "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
                "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
                "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
              ] as const
            ).map((pos) => (
              <span
                key={pos}
                className={cn("border-primary-hover absolute size-8", pos)}
                aria-hidden
              />
            ))}
            <div className="text-background/50 absolute inset-0 flex flex-col items-center justify-center gap-3">
              <ScanLine className="size-12 animate-pulse" aria-hidden />
              <p className="text-sm">Présentez un badge devant la caméra</p>
            </div>
          </div>

          <Button size="lg" className="w-full max-w-xs" onClick={() => simuler()}>
            Simuler un passage
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-background/50 text-xs">Forcer :</span>
            {(Object.keys(VERDICTS) as Verdict[]).map((v) => (
              <button
                key={v}
                onClick={() => simuler(v)}
                className={cn(
                  "size-6 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  VERDICTS[v].fond,
                )}
                aria-label={"Forcer un verdict " + v}
              />
            ))}
          </div>
        </div>

        {/* --------------------- Verdict pleine page (mode amplifié) --------------------- */}
        {resultat ? <VerdictOverlay resultat={resultat} onClose={() => setResultat(null)} /> : null}
      </div>

      {/* ------------------------------- Historique ------------------------------- */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Derniers passages</CardTitle>
          <Badge variant="neutral">Poste 1</Badge>
        </CardHeader>
        <CardContent className="divide-y">
          {historique.map((scan) => {
            const v = VERDICTS[scan.verdict];
            const nomComplet = scan.eleve.prenoms + " " + scan.eleve.nom;
            return (
              <div key={scan.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={cn("size-2.5 shrink-0 rounded-full", v.fond)} aria-hidden />
                <Avatar className="size-8">
                  <AvatarFallback className="text-[11px]">{getInitials(nomComplet)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{nomComplet}</p>
                  <p className="text-muted-foreground truncate text-xs">{scan.detail}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={v.badge}>{v.label}</Badge>
                  <span className="text-muted-foreground text-xs tabular-nums">{scan.heure}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/** Le verdict EST l'écran : couleur pleine page, photo, un mot. Apparition instantanée. */
function VerdictOverlay({ resultat, onClose }: { resultat: ScanResultat; onClose: () => void }) {
  const v = VERDICTS[resultat.verdict];
  const Icone = v.icone;
  return (
    <button
      onClick={onClose}
      aria-label="Fermer le verdict"
      className={cn(
        "absolute inset-0 z-10 flex w-full flex-col items-center justify-center gap-4 px-6 text-white",
        v.fond,
      )}
    >
      <div className="flex size-20 items-center justify-center rounded-full bg-white/15">
        <Icone className="size-11" strokeWidth={2.5} aria-hidden />
      </div>
      <Avatar className="size-28 border-4 border-white/40">
        <AvatarFallback className="bg-white/20 text-3xl font-bold text-white">
          {getInitials(resultat.nom)}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1 text-center">
        <p className="text-3xl font-bold sm:text-4xl">{resultat.nom}</p>
        <p className="text-lg font-semibold text-white/85">{resultat.classe}</p>
      </div>
      <p className="text-4xl font-extrabold tracking-wide sm:text-5xl">{v.mot}</p>
      <p className="text-sm font-medium text-white/85">{resultat.detail}</p>
      <span
        className="absolute bottom-0 left-0 h-1 animate-[verdict-timer_2.6s_linear_forwards] bg-white/50"
        aria-hidden
      />
      <style>{"@keyframes verdict-timer { from { width: 100% } to { width: 0% } }"}</style>
    </button>
  );
}
