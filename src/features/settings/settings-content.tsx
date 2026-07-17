"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  Clock,
  ScrollText,
  ShieldCheck,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
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
import {
  ajouterJourExceptionnel,
  chargerEtablissement,
  definirRole,
  listerAudit,
  listerJoursExceptionnels,
  listerUtilisateurs,
  modifierEtablissement,
  supprimerJourExceptionnel,
  televerserLogo,
  type EntreeAudit,
  type Utilisateur,
} from "@/services/admin.service";
import { urlPhoto } from "@/services/moteur.service";
import { ROLE_LABELS, type Role } from "@/types/auth";
import type { Etablissement, JourExceptionnel } from "@/types/entities";
import type { TypeJourExceptionnel } from "@/types/database";
import { getInitials } from "@/utils/initials";

type Section = "etablissement" | "cantine" | "calendrier" | "utilisateurs" | "securite";

const SECTIONS: Array<{ id: Section; label: string; icon: typeof Building2 }> = [
  { id: "etablissement", label: "Établissement", icon: Building2 },
  { id: "cantine", label: "Cantine", icon: Clock },
  { id: "calendrier", label: "Calendrier", icon: CalendarDays },
  { id: "utilisateurs", label: "Utilisateurs", icon: UserCog },
  { id: "securite", label: "Sécurité", icon: ShieldCheck },
];

export function SettingsContent() {
  const [section, setSection] = useState<Section>("etablissement");
  const [etab, setEtab] = useState<Etablissement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    const e = await chargerEtablissement();
    setEtab(e);
    setLogoUrl(await urlPhoto(e.logo_path));
  }, []);

  useEffect(() => {
    recharger()
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setChargement(false));
  }, [recharger]);

  if (chargement || !etab) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav
        className="flex gap-1 overflow-x-auto lg:w-56 lg:flex-col"
        aria-label="Sections des paramètres"
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const actif = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={
                "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                (actif
                  ? "bg-primary-soft text-primary-pressed"
                  : "text-foreground/70 hover:bg-secondary")
              }
            >
              <Icon
                className={"size-4 " + (actif ? "text-primary" : "text-muted-foreground")}
                aria-hidden
              />
              {s.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 space-y-4">
        {section === "etablissement" ? (
          <EtablissementSection etab={etab} logoUrl={logoUrl} onSauve={recharger} />
        ) : null}
        {section === "cantine" ? <CantineSection etab={etab} onSauve={recharger} /> : null}
        {section === "calendrier" ? <CalendrierSection /> : null}
        {section === "utilisateurs" ? <UtilisateursSection /> : null}
        {section === "securite" ? <SecuriteSection /> : null}
      </div>
    </div>
  );
}

function EtablissementSection({
  etab,
  logoUrl,
  onSauve,
}: {
  etab: Etablissement;
  logoUrl: string | null;
  onSauve: () => Promise<void>;
}) {
  const [enCours, setEnCours] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  async function sauver(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnCours(true);
    try {
      await modifierEtablissement({
        nom: String(f.get("nom")),
        adresse: String(f.get("adresse")),
        telephone: String(f.get("telephone")),
        email: String(f.get("email")),
        ville: String(f.get("ville")),
      });
      toast.success("Établissement enregistré.");
      await onSauve();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec.");
    } finally {
      setEnCours(false);
    }
  }

  async function changerLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512_000) {
      toast.error("Logo trop lourd (512 Ko max).");
      return;
    }
    try {
      await televerserLogo(etab.id, file);
      toast.success("Logo mis à jour.");
      await onSauve();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Identité de l&apos;établissement</CardTitle>
          <CardDescription>Affichée sur les badges et les rapports.</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={sauver}>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-md">
              {logoUrl ? (
                <AvatarImage src={logoUrl} alt="" className="rounded-md object-contain" />
              ) : null}
              <AvatarFallback className="rounded-md">{getInitials(etab.nom)}</AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={changerLogo}
              />
              <Button type="button" variant="secondary" onClick={() => logoRef.current?.click()}>
                <Upload aria-hidden /> Changer le logo
              </Button>
              <p className="text-muted-foreground mt-1 text-[13px]">
                PNG, JPEG, WebP ou SVG — 512 Ko max.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" defaultValue={etab.nom} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code établissement</Label>
              <Input id="code" defaultValue={etab.code} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" name="adresse" defaultValue={etab.adresse ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" name="ville" defaultValue={etab.ville ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" name="telephone" defaultValue={etab.telephone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={etab.email ?? ""} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4 sm:pt-4">
          <Button type="submit" loading={enCours}>
            Enregistrer
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function CantineSection({ etab, onSauve }: { etab: Etablissement; onSauve: () => Promise<void> }) {
  const [politique, setPolitique] = useState(etab.politique_solde_epuise);
  const [reinit, setReinit] = useState(etab.reinit_auto);
  const [heure, setHeure] = useState(etab.heure_service.slice(0, 5));
  const [enCours, setEnCours] = useState(false);

  async function sauver() {
    setEnCours(true);
    try {
      await modifierEtablissement({ heureService: heure, politique, reinitAuto: reinit });
      toast.success("Règles de cantine enregistrées.");
      await onSauve();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Règles de la cantine</CardTitle>
          <CardDescription>Appliquées au point de scan et au calcul des quotas.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="heure">Heure du service</Label>
            <Input
              id="heure"
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="politique">Politique de dette</Label>
            <NativeSelect
              id="politique"
              value={politique}
              onChange={(e) => setPolitique(e.target.value as "strict" | "dette")}
            >
              <option value="dette">Servir avec dette tracée</option>
              <option value="strict">Blocage strict</option>
            </NativeSelect>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="font-medium">Réinitialisation automatique</p>
            <p className="text-muted-foreground text-sm">
              Recalcule le quota mensuel en début de mois selon le calendrier.
            </p>
          </div>
          <Switch
            checked={reinit}
            onCheckedChange={setReinit}
            aria-label="Réinitialisation automatique"
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-4 sm:pt-4">
        <Button onClick={sauver} loading={enCours}>
          Enregistrer
        </Button>
      </CardFooter>
    </Card>
  );
}

const TYPE_JOUR_LABEL: Record<
  TypeJourExceptionnel,
  { label: string; variant: "danger" | "info" | "warning" }
> = {
  ferie: { label: "Férié", variant: "danger" },
  vacances: { label: "Vacances", variant: "info" },
  fermeture: { label: "Fermeture", variant: "warning" },
};

function CalendrierSection() {
  const [jours, setJours] = useState<JourExceptionnel[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);

  const recharger = useCallback(() => {
    setChargement(true);
    listerJoursExceptionnels()
      .then(setJours)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(recharger, [recharger]);

  async function ajouter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnCours(true);
    try {
      await ajouterJourExceptionnel(
        String(f.get("jour")),
        f.get("type") as TypeJourExceptionnel,
        String(f.get("motif")),
      );
      toast.success("Jour ajouté au calendrier.");
      (e.target as HTMLFormElement).reset();
      recharger();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(id: string) {
    try {
      await supprimerJourExceptionnel(id);
      toast.success("Jour retiré.");
      recharger();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec.");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Ajouter un jour exceptionnel</CardTitle>
            <CardDescription>
              Férié, vacances ou fermeture — déduit des quotas mensuels.
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={ajouter}>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="jour">Date</Label>
              <Input id="jour" name="jour" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <NativeSelect id="type" name="type" defaultValue="ferie">
                <option value="ferie">Férié</option>
                <option value="vacances">Vacances</option>
                <option value="fermeture">Fermeture</option>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motif">Motif</Label>
              <Input id="motif" name="motif" placeholder="Fête nationale" required />
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t pt-4 sm:pt-4">
            <Button type="submit" loading={enCours}>
              Ajouter
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jours exceptionnels</CardTitle>
        </CardHeader>
        <CardContent>
          {chargement ? (
            <Skeleton className="h-24" />
          ) : jours.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Aucun jour exceptionnel"
              description="Ajoutez les fériés et fermetures de l'année."
              className="border-0 py-10"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jours.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="tabular-nums">{j.jour}</TableCell>
                    <TableCell>
                      <Badge variant={TYPE_JOUR_LABEL[j.type].variant}>
                        {TYPE_JOUR_LABEL[j.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{j.motif}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => supprimer(j.id)}
                        aria-label={`Supprimer ${j.jour}`}
                      >
                        <Trash2 className="text-destructive" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UtilisateursSection() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(() => {
    setChargement(true);
    listerUtilisateurs()
      .then(setUsers)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(recharger, [recharger]);

  async function changerRole(userId: string, role: Role) {
    try {
      await definirRole(userId, role);
      toast.success("Rôle mis à jour.");
      recharger();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Changement refusé.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Utilisateurs de l&apos;établissement</CardTitle>
          <CardDescription>Administrateurs, responsables et agents de cantine.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <Skeleton className="h-40" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Utilisateur</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-right">Rôle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-[11px]">
                          {getInitials(u.nom_complet)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.nom_complet}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-right">
                    <NativeSelect
                      value={u.role}
                      onChange={(e) => changerRole(u.id, e.target.value as Role)}
                      aria-label={`Rôle de ${u.nom_complet}`}
                      className="w-44"
                    >
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </NativeSelect>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SecuriteSection() {
  const [audit, setAudit] = useState<EntreeAudit[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    listerAudit(50)
      .then(setAudit)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setChargement(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="text-muted-foreground size-5" aria-hidden /> Journal d&apos;audit
          </CardTitle>
          <CardDescription>Actions sensibles tracées — inviolable, lecture admin.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <Skeleton className="h-40" />
        ) : audit.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Aucune action tracée"
            description="Les modifications sensibles apparaîtront ici."
            className="border-0 py-10"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Quand</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                    {new Date(a.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-sm">{a.auteur_nom ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                    {a.cible ? <span className="text-muted-foreground"> · {a.cible}</span> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
