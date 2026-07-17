import type { NextConfig } from "next";

/**
 * En-têtes de sécurité HTTP appliqués à toutes les routes.
 * Objectif : réduire la surface d'attaque (clickjacking, sniffing MIME,
 * fuite de referrer, accès non sollicité aux capteurs).
 * La caméra reste autorisée pour l'origine (poste de scan).
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Caméra autorisée pour l'origine (scan) ; micro/géoloc bloqués.
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // ne pas divulguer la stack
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
