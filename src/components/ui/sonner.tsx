"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toasts du Design System : succès 4 s, les erreurs ne se ferment jamais seules. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-left"
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !shadow-lg",
          error: "!bg-foreground !text-background",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
