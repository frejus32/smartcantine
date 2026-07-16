"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Switch } from "@/components/ui/switch";
import {
  creerEleve,
  modifierEleve,
  televerserPhoto,
  type EleveFormulaire,
} from "@/services/gestion.service";
import type { ClasseDetail, EleveDetail } from "@/services/moteur.service";
import { getInitials } from "@/utils/initials";

const schema = z.object({
  nom: z.string().min(1, "Nom requis."),
  prenoms: z.string().min(1, "Prénoms requis."),
  matricule: z.string().min(1, "Matricule requis."),
  classeId: z.string().uuid("Choisissez une classe."),
});

type Props = {
  ouvert: boolean;
  onOuvertChange: (v: boolean) => void;
  classes: ClasseDetail[];
  eleve?: EleveDetail | null;
  photoUrl?: string | null;
  onEnregistre: () => void;
};

export function StudentFormDialog({
  ouvert,
  onOuvertChange,
  classes,
  eleve,
  photoUrl,
  onEnregistre,
}: Props) {
  const edition = Boolean(eleve);
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const fichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ouvert) {
      setPhoto(null);
      setApercu(null);
      setErreurs({});
    }
  }, [ouvert]);

  function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1_048_576) {
      toast.error("Photo trop lourde (1 Mo maximum).");
      return;
    }
    setPhoto(f);
    setApercu(URL.createObjectURL(f));
  }

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const brut = {
      nom: String(form.get("nom") ?? ""),
      prenoms: String(form.get("prenoms") ?? ""),
      matricule: String(form.get("matricule") ?? ""),
      classeId: String(form.get("classeId") ?? ""),
    };
    const parsed = schema.safeParse(brut);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[i.path[0] as string] ??= i.message;
      setErreurs(errs);
      return;
    }
    setErreurs({});
    setEnCours(true);
    try {
      const payload: EleveFormulaire = {
        ...parsed.data,
        dateNaissance: (form.get("dateNaissance") as string) || null,
        consentementPhoto: form.get("consentement") === "on" || Boolean(photo),
      };
      const enregistre = edition
        ? await modifierEleve(eleve!.id, payload)
        : await creerEleve(payload);
      if (photo) {
        await televerserPhoto(enregistre.id, enregistre.etablissement_id, photo);
      }
      toast.success(edition ? "Élève mis à jour." : "Élève inscrit.");
      onOuvertChange(false);
      onEnregistre();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  const nomComplet = eleve ? `${eleve.prenoms} ${eleve.nom}` : "Nouvel élève";

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edition ? "Modifier l'élève" : "Inscrire un élève"}</DialogTitle>
          <DialogDescription>
            La photo, prise ici, sert au contrôle visuel de l&apos;agent au moment du scan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={soumettre} noValidate className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {apercu ? (
                <AvatarImage src={apercu} alt="" />
              ) : photoUrl ? (
                <AvatarImage src={photoUrl} alt="" />
              ) : (
                <AvatarFallback>{getInitials(nomComplet)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <input
                ref={fichierRef}
                type="file"
                accept="image/jpeg,image/webp"
                className="hidden"
                onChange={choisirPhoto}
              />
              <Button type="button" variant="secondary" onClick={() => fichierRef.current?.click()}>
                <Camera aria-hidden />{" "}
                {apercu || photoUrl ? "Changer la photo" : "Ajouter une photo"}
              </Button>
              <p className="text-muted-foreground mt-1 text-[13px]">JPEG ou WebP, 1 Mo max.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" defaultValue={eleve?.nom} aria-invalid={!!erreurs.nom} />
              {erreurs.nom ? <p className="text-destructive text-[13px]">{erreurs.nom}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenoms">Prénoms</Label>
              <Input
                id="prenoms"
                name="prenoms"
                defaultValue={eleve?.prenoms}
                aria-invalid={!!erreurs.prenoms}
              />
              {erreurs.prenoms ? (
                <p className="text-destructive text-[13px]">{erreurs.prenoms}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input
                id="matricule"
                name="matricule"
                defaultValue={eleve?.matricule}
                aria-invalid={!!erreurs.matricule}
              />
              {erreurs.matricule ? (
                <p className="text-destructive text-[13px]">{erreurs.matricule}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="classeId">Classe</Label>
              <NativeSelect
                id="classeId"
                name="classeId"
                defaultValue={eleve?.classe_id ?? classes[0]?.id}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dateNaissance">Date de naissance (optionnel)</Label>
              <Input
                id="dateNaissance"
                name="dateNaissance"
                type="date"
                defaultValue={eleve?.date_naissance ?? undefined}
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <span className="text-sm">
              <span className="font-medium">Consentement parental (photo)</span>
              <span className="text-muted-foreground block">
                Requis pour stocker la photo de l&apos;élève.
              </span>
            </span>
            <Switch name="consentement" defaultChecked={eleve?.consentement_photo ?? false} />
          </label>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOuvertChange(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={enCours}>
              {edition ? "Enregistrer" : "Inscrire l'élève"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
