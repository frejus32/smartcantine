"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { EleveDetail } from "@/services/moteur.service";
import { getInitials } from "@/utils/initials";

/** Aperçu du badge imprimable : photo + QR signé (généré côté serveur). */
export function StudentBadgeDialog({
  eleve,
  onFermer,
}: {
  eleve: EleveDetail | null;
  onFermer: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!eleve) {
      setQrDataUrl(null);
      return;
    }
    setChargement(true);
    fetch(`/api/badge?studentId=${eleve.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Génération impossible"))))
      .then((d: { qr: string }) => setQrDataUrl(d.qr))
      .catch(() => setQrDataUrl(null))
      .finally(() => setChargement(false));
  }, [eleve]);

  const nomComplet = eleve ? `${eleve.prenoms} ${eleve.nom}` : "";

  return (
    <Dialog open={eleve !== null} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-sm">
        {eleve ? (
          <>
            <DialogHeader>
              <DialogTitle>Badge de {nomComplet}</DialogTitle>
              <DialogDescription>
                QR signé — à imprimer et plastifier au format carte.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-xl border shadow-sm">
              <div className="bg-card flex items-center gap-4 p-4">
                <Avatar className="size-16 rounded-md">
                  {eleve.photo_path ? (
                    <AvatarImage
                      src={`/api/photo?path=${encodeURIComponent(eleve.photo_path)}`}
                      alt=""
                      className="rounded-md"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-md text-lg">
                    {getInitials(nomComplet)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{nomComplet}</p>
                  <p className="text-muted-foreground text-sm">{eleve.classe_nom}</p>
                  <p className="text-muted-foreground font-mono text-xs">{eleve.matricule}</p>
                </div>
                {chargement ? (
                  <Skeleton className="size-20 rounded-sm" />
                ) : qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR code du badge" className="size-20 rounded-sm" />
                ) : (
                  <div className="text-muted-foreground flex size-20 items-center justify-center rounded-sm border text-center text-[10px]">
                    QR indisponible
                  </div>
                )}
              </div>
              <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-xs font-semibold">
                Groupe Scolaire Les Colibris
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={onFermer}>
                Fermer
              </Button>
              <Button
                onClick={() => {
                  window.print();
                  toast.info("Utilisez l'aperçu d'impression de votre navigateur.");
                }}
                disabled={!qrDataUrl}
              >
                <Printer aria-hidden /> Imprimer
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
