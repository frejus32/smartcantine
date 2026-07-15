"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarMinus,
  FlaskConical,
  RotateCcw,
  ScanLine,
  Ticket,
  Undo2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { env } from "@/config/env";
import { VERDICT_META, detailVerdict, type ScanVerdict } from "@/lib/scan/verdict";
import * as moteur from "@/services/moteur.service";
import type { MouvementRepas, Passage } from "@/types/entities";
import { cn } from "@/lib/utils";

const STATUT_PASSAGE_BADGE = {
  servi: { label: "Servi", variant: "success" as const },
  a_regulariser: { label: "À régulariser", variant: "warning" as const },
  annule: { label: "Annulé", variant: "neutral" as const },
};

const TYPE_MOUVEMENT_LABEL: Record<MouvementRepas["type"], string> = {
  credit_mois: "Crédit mois",
  credit_carnet: "Crédit carnet",
  consommation: "Consommation",
  ajustement: "Ajustement",
};

export function Workbench() {
  const [eleves, setEleves] = useState<moteur.EleveResume[]>([]);
  const [eleveId, setEleveId] = useState<string>("");
  const [solde, setSolde] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<ScanVerdict | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [mouvements, setMouvements] = useState<MouvementRepas[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const rafraichir = useCallback(async (id: string) => {
    const [s, p, m] = await Promise.all([
      moteur.soldeEleve(id),
      moteur.listerPassages(id),
      moteur.listerMouvements(id),
    ]);
    setSolde(s);
    setPassages(p);
    setMouvements(m);
  }, []);

  useEffect(() => {
    moteur
      .listerEleves()
      .then((liste) => {
        setEleves(liste);
        if (liste.length > 0) setEleveId(liste[0].id);
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    if (!eleveId) return;
    setVerdict(null);
    rafraichir(eleveId).catch((e: Error) => toast.error(e.message));
  }, [eleveId, rafraichir]);

  /** Exécute une action moteur puis rafraîchit — jamais de logique métier ici. */
  async function executer(nom: string, action: () => Promise<void>) {
    setActionEnCours(nom);
    try {
      await action();
      await rafraichir(eleveId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Le moteur a refusé l'opération.");
    } finally {
      setActionEnCours(null);
    }
  }

  const scanner = () =>
    executer("scan", async () => {
      const v = await moteur.enregistrerPassage(eleveId);
      setVerdict(v);
    });

  const dernierAnnulable = passages.find((p) => p.statut !== "annule");

  if (chargement) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {env.NEXT_PUBLIC_DEMO_MODE ? (
        <div
          role="alert"
          className="border-warning bg-warning-soft flex items-start gap-3 rounded-lg border-l-4 p-4"
        >
          <WifiOff className="text-warning mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold">Mode démonstration : moteur non connecté.</p>
            <p className="text-foreground/70">
              Le banc d&apos;essai pilote le moteur PostgreSQL réel. Connectez un projet Supabase
              (migrations + seed, voir README) puis passez NEXT_PUBLIC_DEMO_MODE à false.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* ------------------------------ Pilotage ------------------------------ */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Élève de test</CardTitle>
                <CardDescription>Le solde est lu en direct depuis le grand livre.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <NativeSelect
                value={eleveId}
                onChange={(e) => setEleveId(e.target.value)}
                aria-label="Choisir un élève"
                className="w-full"
              >
                {eleves.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.matricule} — {e.prenoms} {e.nom}
                    {e.statut === "desactive" ? " (désactivé)" : ""}
                  </option>
                ))}
              </NativeSelect>
              <div className="bg-background flex items-end justify-between rounded-lg border p-4">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Solde actuel
                  </p>
                  <p
                    className={cn(
                      "text-[40px] leading-none font-bold tabular-nums",
                      solde !== null && solde < 0 && "text-warning",
                    )}
                    data-testid="solde"
                  >
                    {solde ?? "—"}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">repas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Actions moteur</CardTitle>
                <CardDescription>
                  Chaque bouton appelle une fonction PostgreSQL — aucune logique côté interface.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Button
                onClick={scanner}
                loading={actionEnCours === "scan"}
                disabled={actionEnCours !== null && actionEnCours !== "scan"}
                className="sm:col-span-2"
              >
                <ScanLine aria-hidden /> Simuler un passage
              </Button>
              <Button
                variant="secondary"
                loading={actionEnCours === "carnet"}
                disabled={actionEnCours !== null && actionEnCours !== "carnet"}
                onClick={() =>
                  executer("carnet", async () => {
                    await moteur.crediterCarnet(eleveId, 5);
                    toast.success("Carnet de 5 repas crédité.");
                  })
                }
              >
                <Ticket aria-hidden /> Créditer carnet +5
              </Button>
              <Button
                variant="secondary"
                loading={actionEnCours === "mois"}
                disabled={actionEnCours !== null && actionEnCours !== "mois"}
                onClick={() =>
                  executer("mois", async () => {
                    const { quota } = await moteur.crediterMoisCourant(eleveId);
                    toast.success(`Mois courant crédité : ${quota} repas (quota calendrier).`);
                  })
                }
              >
                <Ticket aria-hidden /> Créditer le mois
              </Button>
              <Button
                variant="secondary"
                loading={actionEnCours === "veille"}
                disabled={actionEnCours !== null && actionEnCours !== "veille"}
                onClick={() =>
                  executer("veille", async () => {
                    await moteur.passageVeille(eleveId);
                    toast.success("Passage daté d'hier inséré (outil de test).");
                  })
                }
              >
                <CalendarMinus aria-hidden /> Passage daté d&apos;hier
              </Button>
              <Button
                variant="secondary"
                loading={actionEnCours === "annuler"}
                disabled={
                  !dernierAnnulable || (actionEnCours !== null && actionEnCours !== "annuler")
                }
                onClick={() =>
                  executer("annuler", async () => {
                    if (!dernierAnnulable) return;
                    await moteur.annulerPassage(dernierAnnulable.id);
                    toast.success("Passage annulé — contre-écriture +1 au grand livre.");
                  })
                }
              >
                <Undo2 aria-hidden /> Annuler dernier passage
              </Button>
              <Button
                variant="secondary"
                className="sm:col-span-2"
                loading={actionEnCours === "reset"}
                disabled={
                  solde === null ||
                  solde === 0 ||
                  (actionEnCours !== null && actionEnCours !== "reset")
                }
                onClick={() =>
                  executer("reset", async () => {
                    if (solde === null || solde === 0) return;
                    await moteur.ajusterSolde(eleveId, -solde, "Réinitialisation banc d'essai");
                    toast.success("Solde ramené à 0 par contre-écriture (le journal garde tout).");
                  })
                }
              >
                <RotateCcw aria-hidden /> Réinitialiser le solde à 0
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------ Verdict ------------------------------ */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Verdict du moteur</CardTitle>
              <CardDescription>
                Contrat ScanVerdict — le même pour toutes les interfaces.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {verdict ? (
              <div
                data-testid="verdict"
                className={cn(
                  "flex flex-col items-center gap-3 rounded-xl px-6 py-10 text-center text-white",
                  VERDICT_META[verdict.verdict].fond,
                )}
              >
                {verdict.eleve ? <p className="text-2xl font-bold">{verdict.eleve}</p> : null}
                <p className="text-4xl font-extrabold tracking-wide">
                  {VERDICT_META[verdict.verdict].mot}
                </p>
                <p className="font-medium text-white/90">{detailVerdict(verdict)}</p>
                <code className="rounded-sm bg-white/15 px-2 py-1 font-mono text-xs">
                  code: {verdict.code}
                </code>
              </div>
            ) : (
              <EmptyState
                icon={FlaskConical}
                title="Aucun verdict pour l'instant"
                description="Choisissez un élève puis « Simuler un passage » : le verdict du moteur s'affichera ici tel que le scanner le recevra."
                className="py-10"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------ Historiques ------------------------------ */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Passages (10 derniers)</CardTitle>
          </CardHeader>
          <CardContent>
            {passages.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Aucun passage pour cet élève.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead className="text-right">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passages.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums">{p.date_service}</TableCell>
                      <TableCell className="tabular-nums">
                        {new Date(p.horodatage).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={STATUT_PASSAGE_BADGE[p.statut].variant}>
                          {STATUT_PASSAGE_BADGE[p.statut].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grand livre (15 derniers mouvements)</CardTitle>
          </CardHeader>
          <CardContent>
            {mouvements.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Aucun mouvement pour cet élève.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Motif</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mouvements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{TYPE_MOUVEMENT_LABEL[m.type]}</TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-56 truncate sm:table-cell">
                        {m.motif ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          m.quantite > 0 ? "text-success" : "text-foreground",
                        )}
                      >
                        {m.quantite > 0 ? `+${m.quantite}` : m.quantite}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        Rappel : le grand livre est en insertion seule — la « réinitialisation » est une
        contre-écriture, et un passage du jour ne peut être effacé, seulement annulé sous 5 minutes.
      </p>
    </div>
  );
}
