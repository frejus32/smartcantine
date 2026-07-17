"use client";

import { useEffect, useState } from "react";
import { Printer, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { BadgeCard, type BadgeData } from "@/features/badges/badge-card";
import { listerClassesDetail, urlPhoto, type ClasseDetail } from "@/services/moteur.service";
import { chargerEtablissement } from "@/services/admin.service";

export function BadgesContent() {
  const [classes, setClasses] = useState<ClasseDetail[]>([]);
  const [classeId, setClasseId] = useState<string>("toutes");
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [ecole, setEcole] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [chargementInit, setChargementInit] = useState(true);
  const [chargementBadges, setChargementBadges] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listerClassesDetail(), chargerEtablissement()])
      .then(async ([cls, etab]) => {
        setClasses(cls);
        setEcole(etab.nom);
        setLogoUrl(await urlPhoto(etab.logo_path));
      })
      .catch((e: Error) => setErreur(e.message))
      .finally(() => setChargementInit(false));
  }, []);

  async function genererBadges() {
    setChargementBadges(true);
    setErreur(null);
    try {
      const params = classeId !== "toutes" ? `?classeId=${classeId}` : "";
      const res = await fetch(`/api/badges${params}`);
      if (!res.ok) throw new Error("Génération impossible.");
      const data: { badges: BadgeData[] } = await res.json();
      setBadges(data.badges);
      if (data.badges.length === 0) toast.info("Aucun élève actif dans cette sélection.");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Génération impossible.");
    } finally {
      setChargementBadges(false);
    }
  }

  if (chargementInit) {
    return <Skeleton className="h-40" />;
  }

  if (erreur && badges.length === 0) {
    return <ErrorState description={erreur} onRetry={genererBadges} />;
  }

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-6">
          <div className="flex-1 space-y-2">
            <label htmlFor="classe-badges" className="text-sm font-medium">
              Sélection
            </label>
            <NativeSelect
              id="classe-badges"
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className="w-full sm:max-w-xs"
            >
              <option value="toutes">Toute l&apos;école</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.effectif})
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button onClick={genererBadges} loading={chargementBadges}>
            <QrCode aria-hidden /> Générer les badges
          </Button>
          {badges.length > 0 ? (
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden /> Imprimer ({badges.length})
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {badges.length === 0 ? (
        <div className="print:hidden">
          <EmptyState
            icon={QrCode}
            title="Aucun badge généré"
            description="Choisissez une classe ou toute l'école, puis générez les badges signés à imprimer."
          />
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm print:hidden">
            {badges.length} badge{badges.length > 1 ? "s" : ""} — aperçu de la planche A4. Utilisez
            « Imprimer » puis choisissez le format A4.
          </p>
          <div className="badge-sheet grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {badges.map((b) => (
              <BadgeCard key={b.id} badge={b} ecole={ecole} logoUrl={logoUrl} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
