"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listerClassesDetail,
  listerElevesDetail,
  type ClasseDetail,
  type EleveDetail,
} from "@/services/moteur.service";

type EtatDonnees = {
  eleves: EleveDetail[];
  classes: ClasseDetail[];
  chargement: boolean;
  erreur: string | null;
};

/** Charge élèves + classes réels et expose un rafraîchissement après mutation. */
export function useStudentsData() {
  const [etat, setEtat] = useState<EtatDonnees>({
    eleves: [],
    classes: [],
    chargement: true,
    erreur: null,
  });

  const charger = useCallback(async () => {
    setEtat((e) => ({ ...e, chargement: true, erreur: null }));
    try {
      const [eleves, classes] = await Promise.all([listerElevesDetail(), listerClassesDetail()]);
      setEtat({ eleves, classes, chargement: false, erreur: null });
    } catch (e) {
      setEtat((prev) => ({
        ...prev,
        chargement: false,
        erreur: e instanceof Error ? e.message : "Chargement impossible.",
      }));
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  return { ...etat, rafraichir: charger };
}
