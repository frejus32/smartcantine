"use client";

import { KeyRound, MonitorSmartphone } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/utils/initials";

export function ProfileView() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <Avatar className="size-20">
            <AvatarFallback className="text-2xl">{getInitials("Awa Yao")}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-xl font-bold">Awa Yao</p>
            <p className="text-muted-foreground text-sm">demo@smartcantine.ci</p>
            <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
              <Badge variant="primary">Administrateur</Badge>
              <Badge variant="neutral">Groupe Scolaire Les Colibris</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Votre identité telle qu&apos;affichée dans l&apos;application.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nom-complet">Nom complet</Label>
            <Input id="nom-complet" defaultValue="Awa Yao" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" defaultValue="demo@smartcantine.ci" disabled />
            <p className="text-muted-foreground text-[13px]">
              L&apos;email de connexion est géré par votre administrateur.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4 sm:pt-4">
          <Button onClick={() => toast.success("Profil mis à jour.")}>Enregistrer</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="text-muted-foreground size-5" aria-hidden /> Sécurité
            </CardTitle>
            <CardDescription>Changez votre mot de passe régulièrement.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mdp-actuel">Mot de passe actuel</Label>
            <Input id="mdp-actuel" type="password" autoComplete="current-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mdp-nouveau">Nouveau mot de passe</Label>
            <Input id="mdp-nouveau" type="password" autoComplete="new-password" />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4 sm:pt-4">
          <Button onClick={() => toast.success("Mot de passe modifié (démonstration).")}>
            Mettre à jour
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="text-muted-foreground size-5" aria-hidden /> Session
            </CardTitle>
            <CardDescription>Appareil actuellement connecté à ce compte.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Cet appareil</p>
              <p className="text-muted-foreground text-sm">
                Abidjan, Côte d&apos;Ivoire — dernière activité : maintenant
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <Separator className="my-4" />
          <p className="text-muted-foreground text-sm">
            La déconnexion à distance des autres appareils arrivera avec le module comptes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
