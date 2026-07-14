import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "@/styles/globals.css";
import { AppProviders } from "@/providers/app-providers";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: { default: site.name, template: "%s — " + site.name },
  description: site.tagline,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
