import { site } from "@/config/site";

function Footer() {
  return (
    <footer className="text-muted-foreground border-t px-4 py-4 text-center text-xs sm:px-6">
      {site.name} v{site.version} — {site.tagline}. © {new Date().getFullYear()}
    </footer>
  );
}

export { Footer };
