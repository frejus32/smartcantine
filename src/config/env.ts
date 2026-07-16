import { z } from "zod";

/**
 * Variables d'environnement publiques, validées au démarrage.
 * Échoue vite et clairement plutôt que de produire des erreurs obscures à l'exécution.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  /** Mode démonstration : navigation sans Supabase, utilisateur fictif. */
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /** Clé publique Ed25519 (hex) vérifiant la signature des badges au scan. */
  NEXT_PUBLIC_QR_PUBLIC_KEY: z.string().regex(/^[0-9a-f]{64}$/i),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_QR_PUBLIC_KEY: process.env.NEXT_PUBLIC_QR_PUBLIC_KEY,
});
