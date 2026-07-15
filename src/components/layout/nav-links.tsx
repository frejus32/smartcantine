"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FlaskConical,
  LayoutDashboard,
  ScanLine,
  Settings,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/config/routes";
import type { Role } from "@/types/auth";
import { cn } from "@/lib/utils";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  students: Users,
  scanner: ScanLine,
  calendar: CalendarDays,
  reports: BarChart3,
  workbench: FlaskConical,
  settings: Settings,
  profile: User,
};

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium transition-colors duration-150",
              active
                ? "bg-primary-soft text-primary-pressed font-semibold"
                : "text-foreground/70 hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon
              className={cn("size-5", active ? "text-primary" : "text-muted-foreground")}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { NavLinks };
