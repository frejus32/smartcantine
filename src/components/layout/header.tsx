"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/services/auth.service";
import { ROLE_LABELS, type Role } from "@/types/auth";
import { getInitials } from "@/utils/initials";

type HeaderProps = { role: Role; email: string; displayName: string };

function Header({ role, email, displayName }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    toast.success("Vous êtes déconnecté.");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-card/95 sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <div className="flex h-16 items-center border-b px-5">
              <Brand />
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <NavLinks role={role} onNavigate={() => setMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <Brand className="lg:hidden" />
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="primary" className="hidden sm:inline-flex">
          {ROLE_LABELS[role]}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger className="focus-visible:outline-ring rounded-full focus-visible:outline-2 focus-visible:outline-offset-2">
            <Avatar>
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Ouvrir le menu du compte</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <span className="text-foreground block text-sm font-semibold">{displayName}</span>
              <span className="block truncate font-normal">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/profile")}>
              <User aria-hidden /> Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="text-destructive focus:bg-destructive-soft focus:text-destructive"
            >
              <LogOut className="!text-destructive" aria-hidden /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { Header };
