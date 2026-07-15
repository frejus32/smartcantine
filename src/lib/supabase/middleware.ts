import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/config/env";
import { roleFromMetadata } from "@/types/auth";
import { PUBLIC_ROUTES, canAccess, homeForRole } from "@/config/routes";

/**
 * Rafraîchit la session (cookies) puis applique la protection des routes :
 *  - non connecté -> /login (avec retour post-connexion via ?next=)
 *  - connecté sur /login -> page d'accueil de son rôle
 *  - connecté sans droit sur la route -> page d'accueil de son rôle
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Mode démonstration : aucune barrière d'authentification (échafaudage UI).
  if (env.NEXT_PUBLIC_DEMO_MODE) {
    const { pathname } = request.nextUrl;
    if (pathname === "/" || pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Important : pas de logique entre la création du client et getUser() (risque de déconnexions aléatoires).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (!user) {
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = roleFromMetadata(user.app_metadata);

  if (isPublic || pathname === "/" || !canAccess(role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
