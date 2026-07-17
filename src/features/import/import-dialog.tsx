"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  analyserFichier,
  genererModele,
  importerLignes,
  type LigneImport,
} from "@/services/import.service";
import type { ClasseDetail, EleveDetail } from "@/services/moteur.service";

type Etape = "depot" | "apercu" | "resultat";

const STATUT_BADGE = {
  valide: { label: "Valide", variant: "success" as const },
  doublon: { label: "Doublon", variant: "warning" as const },
  erreur: { label: "Erreur", variant: "danger" as const },
};

export function ImportDialog({
  ouvert,
  onOuvertChange,
  classes,
  eleves,
  onImporte,
}: {
  ouvert: boolean;
  onOuvertChange: (v: boolean) => void;
  classes: ClasseDetail[];
  eleves: EleveDetail[];
  onImporte: () => void;
}) {
  const [etape, setEtape] = useState<Etape>("depot");
  const [lignes, setLignes] = useState<LigneImport[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<{ crees: number; echecs: number } | null>(null);
  const fichierRef = useRef<HTMLInputElement>(null);

  function reinitialiser() {
    setEtape("depot");
    setLignes([]);
    setResultat(null);
  }

  async function surFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const buffer = await f.arrayBuffer();
      const analyse = await analyserFichier(buffer, classes, eleves);
      if (analyse.length === 0) {
        toast.error("Le fichier ne contient aucune ligne exploitable.");
        return;
      }
      setLignes(analyse);
      setEtape("apercu");
    } catch {
      toast.error("Fichier illisible. Utilisez le modèle Excel fourni.");
    } finally {
      if (fichierRef.current) fichierRef.current.value = "";
    }
  }

  async function telechargerModele() {
    const blob = await genererModele(classes);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-eleves.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function lancerImport() {
    setEnCours(true);
    try {
      const res = await importerLignes(lignes);
      setResultat({ crees: res.crees, echecs: res.echecs.length });
      setEtape("resultat");
      if (res.crees > 0) onImporte();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible.");
    } finally {
      setEnCours(false);
    }
  }

  const nbValides = lignes.filter((l) => l.statut === "valide").length;
  const nbDoublons = lignes.filter((l) => l.statut === "doublon").length;
  const nbErreurs = lignes.filter((l) => l.statut === "erreur").length;

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(v) => {
        onOuvertChange(v);
        if (!v) setTimeout(reinitialiser, 200);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des élèves depuis Excel</DialogTitle>
          <DialogDescription>
            Colonnes attendues : matricule, nom, prenoms, classe. Les doublons et erreurs sont
            détectés avant l&apos;import.
          </DialogDescription>
        </DialogHeader>

        {etape === "depot" ? (
          <div className="space-y-4">
            <button
              onClick={() => fichierRef.current?.click()}
              className="hover:border-primary hover:bg-primary-soft/40 flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors"
            >
              <div className="bg-primary-soft flex size-14 items-center justify-center rounded-full">
                <Upload className="text-primary size-7" aria-hidden />
              </div>
              <span className="font-semibold">Choisir un fichier Excel (.xlsx)</span>
              <span className="text-muted-foreground text-sm">
                ou glissez-le ici — les classes doivent déjà exister
              </span>
            </button>
            <input
              ref={fichierRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={surFichier}
            />
            <Button variant="secondary" onClick={() => void telechargerModele()} className="w-full">
              <Download aria-hidden /> Télécharger le modèle Excel
            </Button>
          </div>
        ) : null}

        {etape === "apercu" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{nbValides} valides</Badge>
              {nbDoublons > 0 ? <Badge variant="warning">{nbDoublons} doublons</Badge> : null}
              {nbErreurs > 0 ? <Badge variant="danger">{nbErreurs} erreurs</Badge> : null}
            </div>
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Ligne</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead className="text-right">État</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l) => (
                    <TableRow key={l.ligne}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {l.ligne}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.matricule || "—"}</TableCell>
                      <TableCell>
                        <div>
                          <span>{`${l.prenoms} ${l.nom}`.trim() || "—"}</span>
                          {l.message ? (
                            <span className="text-muted-foreground block text-xs">{l.message}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{l.classe || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={STATUT_BADGE[l.statut].variant}>
                          {STATUT_BADGE[l.statut].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        {etape === "resultat" && resultat ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="bg-success-soft flex size-16 items-center justify-center rounded-full">
              <FileSpreadsheet className="text-success size-8" aria-hidden />
            </div>
            <p className="text-lg font-semibold">
              {resultat.crees} élève{resultat.crees > 1 ? "s" : ""} importé
              {resultat.crees > 1 ? "s" : ""}
            </p>
            {resultat.echecs > 0 ? (
              <p className="text-warning text-sm">{resultat.echecs} ligne(s) en échec.</p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          {etape === "apercu" ? (
            <>
              <Button variant="secondary" onClick={reinitialiser}>
                Changer de fichier
              </Button>
              <Button onClick={lancerImport} loading={enCours} disabled={nbValides === 0}>
                Importer {nbValides} élève{nbValides > 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOuvertChange(false)}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
