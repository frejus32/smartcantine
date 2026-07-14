import { QrCode } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
        <QrCode className="size-5" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
    </span>
  );
}

export { Brand };
