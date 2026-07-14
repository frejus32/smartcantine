export const ROLES = ["admin", "responsable", "agent"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  responsable: "Responsable",
  agent: "Agent de cantine",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Le rôle vit dans app_metadata (non modifiable par l'utilisateur, contrairement à user_metadata). */
export function roleFromMetadata(appMetadata: Record<string, unknown> | undefined): Role {
  const value = appMetadata?.role;
  return isRole(value) ? value : "agent";
}
