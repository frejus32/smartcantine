import { Suspense } from "react";
import type { Metadata } from "next";
import { QrCode, ShieldCheck, WifiOff } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "@/features/auth/login-form";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Connexion" };

const PROMISES = [
  { icon: ShieldCheck, text: "Un élève, un repas par jour — garanti." },
  { icon: QrCode, text: "Le badge QR remplace le ticket papier." },
  { icon: WifiOff, text: "Le scan fonctionne même sans Internet." },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="bg-primary text-primary-foreground hidden flex-col justify-between p-10 lg:flex">
        <Brand className="[&_span:first-child]:bg-white/10 [&_span:last-child]:text-white" />
        <div className="space-y-8">
          <h1 className="font-display max-w-md text-4xl leading-tight font-bold">
            La cantine scolaire sans tickets papier.
          </h1>
          <ul className="space-y-4">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <Icon className="size-5 shrink-0" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/60">
          {site.name} — conçu pour les écoles maternelles, primaires et collèges.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 lg:hidden">
            <Brand />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold">Connexion</h2>
            <p className="text-muted-foreground">Accédez à votre espace {site.name}.</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
