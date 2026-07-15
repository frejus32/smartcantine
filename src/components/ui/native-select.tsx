import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Select natif stylé : fiable au clavier, natif sur mobile (Design System 9.3). */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        className={cn(
          "border-input bg-card h-11 w-full appearance-none rounded-md border pr-9 pl-3 text-[15px]",
          "hover:border-muted-foreground transition-colors",
          "focus-visible:border-primary focus-visible:outline-primary-soft focus-visible:outline-2 focus-visible:outline-offset-0",
          "disabled:bg-secondary disabled:cursor-not-allowed",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        aria-hidden
      />
    </span>
  );
}

export { NativeSelect };
