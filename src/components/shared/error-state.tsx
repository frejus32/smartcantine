"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

/** Ce qui s'est passé + quoi faire. Jamais vague, jamais technique. */
function ErrorState({
  title = "Impossible de charger les données",
  description = "Vérifiez votre connexion puis réessayez.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "bg-card flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-destructive-soft flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="text-destructive size-7" aria-hidden />
      </div>
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
