import type { Role } from "@/types/auth";

export type NavItem = {
  href: string;
  label: string;
  /** Nom d'icône Lucide, résolu dans la Sidebar (les icônes ne sont pas sérialisables). */
  icon: "dashboard" | "students" | "scanner" | "calendar" | "reports" | "settings" | "profile";
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: "dashboard",
    roles: ["admin", "responsable"],
  },
  { href: "/students", label: "Élèves", icon: "students", roles: ["admin", "responsable"] },
  { href: "/scanner", label: "Scanner", icon: "scanner", roles: ["admin", "responsable", "agent"] },
  { href: "/calendar", label: "Calendrier", icon: "calendar", roles: ["admin", "responsable"] },
  { href: "/reports", label: "Rapports", icon: "reports", roles: ["admin", "responsable"] },
  { href: "/settings", label: "Paramètres", icon: "settings", roles: ["admin"] },
  { href: "/profile", label: "Profil", icon: "profile", roles: ["admin", "responsable", "agent"] },
];

export const PUBLIC_ROUTES = ["/login"];

/** Page d'accueil selon le rôle : l'agent atterrit directement sur le scanner. */
export function homeForRole(role: Role): string {
  return role === "agent" ? "/scanner" : "/dashboard";
}

export function canAccess(role: Role, pathname: string): boolean {
  const item = NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  return item ? item.roles.includes(role) : true;
}
