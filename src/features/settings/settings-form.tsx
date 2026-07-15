"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS, type Role } from "@/types/auth";
import { getInitials } from "@/utils/initials";

const EQUIPE: Array<{ nom: string; email: string; role: Role }> = [
  { nom: "Awa Yao", email: "admin@colibris.ci", role: "admin" },
  { nom: "Adjoua Konan", email: "responsable@colibris.ci", role: "responsable" },
  { nom: "Koffi N'Guessan", email: "agent@colibris.ci", role: "agent" },
];

export function SettingsForm() {
  const [soldeNul, setSoldeNul] = useState<"strict" | "dette">("dette");
  const [mercredi, setMercredi] = useState(true);
  const [confirmOuverte, setConfirmOuverte] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Établissement</CardTitle>
            <CardDescription>Identité affichée sur les badges et les rapports.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nom-ecole">Nom de l&apos;établissement</Label>
            <Input id="nom-ecole" defaultValue="Groupe Scolaire Les Colibris" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-ecole">Code établissement</Label>
            <Input id="code-ecole" defaultValue="COLIBRIS01" disabled />
            <p className="text-muted-foreground text-[13px]">
              Identifiant support — attribué par SmartCantine, non modifiable.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ville">Ville</Label>
            <Input id="ville" defaultValue="Abidjan" />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4 sm:pt-4">
          <Button onClick={() => toast.success("Paramètres de l'établissement enregistrés.")}>
            Enregistrer
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cantine</CardTitle>
            <CardDescription>Règles appliquées au point de scan.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Comportement à solde épuisé</legend>
            <label className="has-[:checked]:border-primary has-[:checked]:bg-primary-soft/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors">
              <input
                type="radio"
                name="solde-nul"
                className="mt-1 size-4 accent-[#1E5AA8]"
                checked={soldeNul === "dette"}
                onChange={() => setSoldeNul("dette")}
              />
              <span>
                <span className="block font-medium">Servir avec dette tracée (recommandé)</span>
                <span className="text-muted-foreground block text-sm">
                  L&apos;élève est servi ; le repas apparaît « à régulariser » dans le rapport du
                  jour.
                </span>
              </span>
            </label>
            <label className="has-[:checked]:border-primary has-[:checked]:bg-primary-soft/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors">
              <input
                type="radio"
                name="solde-nul"
                className="mt-1 size-4 accent-[#1E5AA8]"
                checked={soldeNul === "strict"}
                onChange={() => setSoldeNul("strict")}
              />
              <span>
                <span className="block font-medium">Blocage strict</span>
                <span className="text-muted-foreground block text-sm">
                  Verdict orange : l&apos;élève est orienté vers l&apos;économat avant d&apos;être
                  servi.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Cantine ouverte le mercredi</p>
              <p className="text-muted-foreground text-sm">
                Compte le mercredi dans le calcul des quotas mensuels.
              </p>
            </div>
            <Switch
              checked={mercredi}
              onCheckedChange={setMercredi}
              aria-label="Cantine ouverte le mercredi"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4 sm:pt-4">
          <Button onClick={() => toast.success("Règles de cantine enregistrées.")}>
            Enregistrer
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Équipe</CardTitle>
            <CardDescription>Comptes ayant accès à SmartCantine pour cette école.</CardDescription>
          </div>
          <Button
            variant="secondary"
            onClick={() => toast.info("L'invitation d'utilisateurs arrive avec le module comptes.")}
          >
            Inviter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Utilisateur</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-right">Rôle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EQUIPE.map((u) => (
                <TableRow key={u.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-[11px]">
                          {getInitials(u.nom)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.nom}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={u.role === "admin" ? "primary" : "neutral"}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <div>
            <CardTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="size-5" aria-hidden /> Zone sensible
            </CardTitle>
            <CardDescription>
              Actions irréversibles — réservées à l&apos;administrateur.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium">Suspendre l&apos;année scolaire</p>
            <p className="text-muted-foreground text-sm">
              Désactive le scan et fige les compteurs jusqu&apos;à réactivation.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setConfirmOuverte(true)}>
            Suspendre
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOuverte} onOpenChange={setConfirmOuverte}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suspendre l&apos;année scolaire ?</DialogTitle>
            <DialogDescription>
              Le scan sera bloqué sur tous les postes et les compteurs seront figés. Cette action
              est réversible uniquement par un administrateur.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmOuverte(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOuverte(false);
                toast.success("Année scolaire suspendue (démonstration).");
              }}
            >
              Suspendre l&apos;année
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
