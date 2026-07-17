import { z } from "zod";

/** Schémas de validation partagés pour les routes API (défense en profondeur). */

export const uuidSchema = z.string().uuid();

/**
 * Chemin de fichier Storage : "{uuid}/....". Interdit toute remontée de
 * répertoire ou caractère de contrôle. La RLS Storage borne déjà l'accès à
 * l'établissement ; cette validation réduit la surface d'attaque en amont.
 */
export const storagePathSchema = z
  .string()
  .min(1)
  .max(300)
  .regex(/^[0-9a-f-]{36}\/[A-Za-z0-9._/-]+$/i, "Chemin de fichier invalide")
  .refine((p) => !p.includes(".."), "Remontée de répertoire interdite");
