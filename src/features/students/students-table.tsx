"use client";

import { useMemo, useState } from "react";
import { CameraOff, Plus, QrCode, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MOCK_CLASSES, MOCK_ELEVES, classeById, type MockEleve } from "@/lib/mock/data";
import { getInitials } from "@/utils/initials";

const PAGE_SIZE = 8;

export function StudentsTable() {
  const [recherche, setRecherche] = useState("");
  const [classeFiltre, setClasseFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");
  const [page, setPage] = useState(1);
  const [qrEleve, setQrEleve] = useState<MockEleve | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return MOCK_ELEVES.filter((e) => {
      const nomComplet = (e.prenoms + " " + e.nom + " " + e.matricule).toLowerCase();
      if (terme && !nomComplet.includes(terme)) return false;
      if (classeFiltre !== "toutes" && e.classeId !== classeFiltre) return false;
      if (statutFiltre !== "tous" && e.statut !== statutFiltre) return false;
      return true;
    });
  }, [recherche, classeFiltre, statutFiltre]);

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAGE_SIZE));
  const pageCourante = Math.min(page, totalPages);
  const visibles = filtres.slice((pageCourante - 1) * PAGE_SIZE, pageCourante * PAGE_SIZE);

  function resetFiltres() {
    setRecherche("");
    setClasseFiltre("toutes");
    setStatutFiltre("tous");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un élève ou un matricule…"
            className="pl-9"
            aria-label="Rechercher un élève"
          />
        </div>
        <NativeSelect
          value={classeFiltre}
          onChange={(e) => {
            setClasseFiltre(e.target.value);
            setPage(1);
          }}
          aria-label="Filtrer par classe"
          className="sm:w-48"
        >
          <option value="toutes">Toutes les classes</option>
          {MOCK_CLASSES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={statutFiltre}
          onChange={(e) => {
            setStatutFiltre(e.target.value);
            setPage(1);
          }}
          aria-label="Filtrer par statut"
          className="sm:w-40"
        >
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="desactive">Désactivé</option>
        </NativeSelect>
        <Button onClick={() => setAjoutOuvert(true)}>
          <Plus aria-hidden /> Inscrire un élève
        </Button>
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun élève ne correspond"
          description="Modifiez votre recherche ou vos filtres pour retrouver les élèves."
          action={
            <Button variant="secondary" onClick={resetFiltres}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Élève</TableHead>
                <TableHead className="hidden md:table-cell">Matricule</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Solde repas</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Badge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((e) => {
                const nomComplet = e.prenoms + " " + e.nom;
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs">
                            {getInitials(nomComplet)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{nomComplet}</p>
                          {e.photoManquante ? (
                            <span className="text-warning inline-flex items-center gap-1 text-xs">
                              <CameraOff className="size-3" aria-hidden /> Photo manquante
                            </span>
                          ) : (
                            <p className="text-muted-foreground text-xs md:hidden">{e.matricule}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                      {e.matricule}
                    </TableCell>
                    <TableCell>{classeById(e.classeId).nom}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {e.solde === 0 ? (
                        <Badge variant="warning">Épuisé</Badge>
                      ) : (
                        <span className="font-medium">{e.solde} repas</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {e.statut === "actif" ? (
                        <Badge variant="success">Actif</Badge>
                      ) : (
                        <Badge variant="neutral">Désactivé</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQrEleve(e)}
                            aria-label={"Voir le badge de " + nomComplet}
                          >
                            <QrCode aria-hidden />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Aperçu du badge QR</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm tabular-nums">
              {(pageCourante - 1) * PAGE_SIZE + 1}–
              {Math.min(pageCourante * PAGE_SIZE, filtres.length)} sur {filtres.length} élèves
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pageCourante <= 1}
                onClick={() => setPage(pageCourante - 1)}
              >
                Précédent
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {pageCourante} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pageCourante >= totalPages}
                onClick={() => setPage(pageCourante + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ---- Aperçu du badge (placeholder QR — le vrai QR signé arrive au sprint QR) ---- */}
      <Dialog open={qrEleve !== null} onOpenChange={(open) => !open && setQrEleve(null)}>
        <DialogContent className="max-w-sm">
          {qrEleve ? (
            <>
              <DialogHeader>
                <DialogTitle>Badge de {qrEleve.prenoms + " " + qrEleve.nom}</DialogTitle>
                <DialogDescription>
                  Aperçu du badge tel qu&apos;il sera imprimé et plastifié.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <div className="bg-card flex items-center gap-4 p-4">
                  <Avatar className="size-16 rounded-md">
                    <AvatarFallback className="rounded-md text-lg">
                      {getInitials(qrEleve.prenoms + " " + qrEleve.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{qrEleve.prenoms + " " + qrEleve.nom}</p>
                    <p className="text-muted-foreground text-sm">
                      {classeById(qrEleve.classeId).nom}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">{qrEleve.matricule}</p>
                  </div>
                  <div
                    className="grid size-20 shrink-0 grid-cols-6 gap-0.5 rounded-sm border bg-white p-1.5"
                    role="img"
                    aria-label="QR Code de démonstration"
                  >
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span
                        key={i}
                        className={((i * 7 + 3) % 5) % 2 === 0 ? "bg-foreground" : "bg-white"}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-xs font-semibold">
                  Groupe Scolaire Les Colibris
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setQrEleve(null)}>
                  Fermer
                </Button>
                <Button
                  onClick={() => toast.info("L'impression des badges arrive avec le module QR.")}
                >
                  Imprimer le badge
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ---- Inscription (visuel uniquement — la vraie création arrive au sprint Élèves) ---- */}
      <Dialog open={ajoutOuvert} onOpenChange={setAjoutOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrire un élève</DialogTitle>
            <DialogDescription>
              La photo sera prise à l&apos;étape suivante, au moment de créer le badge.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" placeholder="Kouassi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenoms">Prénoms</Label>
              <Input id="prenoms" placeholder="Aya Grâce" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input id="matricule" placeholder="COL-0025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classe">Classe</Label>
              <NativeSelect id="classe" defaultValue={MOCK_CLASSES[0].id}>
                {MOCK_CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAjoutOuvert(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setAjoutOuvert(false);
                toast.success(
                  "Élève inscrit (démonstration) — la création réelle arrive au sprint Élèves.",
                );
              }}
            >
              Inscrire l&apos;élève
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
