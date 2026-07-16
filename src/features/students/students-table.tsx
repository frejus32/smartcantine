"use client";

import { useMemo, useState } from "react";
import {
  CameraOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  QrCode,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StudentFormDialog } from "@/features/students/student-form-dialog";
import { StudentBadgeDialog } from "@/features/students/student-badge-dialog";
import { useStudentsData } from "@/features/students/use-students-data";
import { definirStatutEleve } from "@/services/gestion.service";
import type { EleveDetail } from "@/services/moteur.service";
import { getInitials } from "@/utils/initials";

const PAGE_SIZE = 8;

export function StudentsTable() {
  const { eleves, classes, chargement, erreur, rafraichir } = useStudentsData();
  const [recherche, setRecherche] = useState("");
  const [classeFiltre, setClasseFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");
  const [page, setPage] = useState(1);
  const [formOuvert, setFormOuvert] = useState(false);
  const [eleveEdite, setEleveEdite] = useState<EleveDetail | null>(null);
  const [badgeEleve, setBadgeEleve] = useState<EleveDetail | null>(null);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return eleves.filter((e) => {
      const cible = `${e.prenoms} ${e.nom} ${e.matricule}`.toLowerCase();
      if (terme && !cible.includes(terme)) return false;
      if (classeFiltre !== "toutes" && e.classe_id !== classeFiltre) return false;
      if (statutFiltre !== "tous" && e.statut !== statutFiltre) return false;
      return true;
    });
  }, [eleves, recherche, classeFiltre, statutFiltre]);

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAGE_SIZE));
  const pageCourante = Math.min(page, totalPages);
  const visibles = filtres.slice((pageCourante - 1) * PAGE_SIZE, pageCourante * PAGE_SIZE);

  async function basculerStatut(e: EleveDetail) {
    const cible = e.statut === "actif" ? "desactive" : "actif";
    try {
      await definirStatutEleve(e.id, cible);
      toast.success(cible === "actif" ? "Élève réactivé." : "Élève désactivé.");
      void rafraichir();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action impossible.");
    }
  }

  function ouvrirCreation() {
    setEleveEdite(null);
    setFormOuvert(true);
  }
  function ouvrirEdition(e: EleveDetail) {
    setEleveEdite(e);
    setFormOuvert(true);
  }

  if (chargement) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-44" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (erreur) {
    return <ErrorState description={erreur} onRetry={() => void rafraichir()} />;
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
          {classes.map((c) => (
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
        <Button onClick={ouvrirCreation}>
          <Plus aria-hidden /> Inscrire un élève
        </Button>
      </div>

      {eleves.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun élève inscrit"
          description="Commencez par créer une classe dans les paramètres, puis inscrivez votre premier élève."
          action={<Button onClick={ouvrirCreation}>Inscrire le premier élève</Button>}
        />
      ) : visibles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun élève ne correspond"
          description="Modifiez votre recherche ou vos filtres."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setRecherche("");
                setClasseFiltre("toutes");
                setStatutFiltre("tous");
              }}
            >
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((e) => {
                const nomComplet = `${e.prenoms} ${e.nom}`;
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          {e.photo_path ? (
                            <AvatarImage
                              src={`/api/photo?path=${encodeURIComponent(e.photo_path)}`}
                              alt=""
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {getInitials(nomComplet)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{nomComplet}</p>
                          {!e.photo_path ? (
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
                    <TableCell>{e.classe_nom}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {e.solde <= 0 ? (
                        <Badge variant="warning">{e.solde === 0 ? "Épuisé" : `${e.solde}`}</Badge>
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
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setBadgeEleve(e)}
                              aria-label={`Badge de ${nomComplet}`}
                            >
                              <QrCode aria-hidden />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Badge QR</TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions pour ${nomComplet}`}
                            >
                              <MoreHorizontal aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => ouvrirEdition(e)}>
                              <Pencil aria-hidden /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void basculerStatut(e)}>
                              <Power aria-hidden />
                              {e.statut === "actif" ? "Désactiver" : "Réactiver"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

      <StudentFormDialog
        ouvert={formOuvert}
        onOuvertChange={setFormOuvert}
        classes={classes}
        eleve={eleveEdite}
        onEnregistre={() => void rafraichir()}
      />
      <StudentBadgeDialog eleve={badgeEleve} onFermer={() => setBadgeEleve(null)} />
    </div>
  );
}
