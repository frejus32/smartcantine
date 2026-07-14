import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";
import type { Role } from "@/types/auth";

/** Barre latérale desktop — la version mobile vit dans le Header (Sheet). */
function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="bg-card fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/dashboard"
          className="focus-visible:outline-ring rounded-md focus-visible:outline-2"
        >
          <Brand />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks role={role} />
      </div>
      <div className="text-muted-foreground border-t p-4 text-xs">Un élève, un repas par jour.</div>
    </aside>
  );
}

export { Sidebar };
