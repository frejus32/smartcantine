import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "border-input bg-card h-11 w-full rounded-md border px-3 text-[15px] transition-colors",
        "placeholder:text-muted-foreground hover:border-muted-foreground",
        "focus-visible:border-primary focus-visible:outline-primary-soft focus-visible:outline-2 focus-visible:outline-offset-0",
        "disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
