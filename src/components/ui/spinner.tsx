import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" className="text-muted-foreground inline-flex items-center gap-2">
      <Loader2 className={cn("size-5 animate-spin", className)} aria-hidden />
      <span className={label ? "text-sm" : "sr-only"}>{label ?? "Chargement en cours"}</span>
    </span>
  );
}

export { Spinner };
