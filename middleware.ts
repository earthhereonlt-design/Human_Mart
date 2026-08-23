import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "public-anon-key";

const PROTECTED_PREFIXES = ["/list", "/account", "/checkout", "/admin"];
const AUTH_PAGES = ["/login", "/register"];
const MAINTENANCE_EXEMPT = ["/admin", "/maintenance"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without credentials there is no session to refresh or protect —
  // pages render their own "finish setup" notices.
  if (!url || !key || !url.startsWith("http")) {
    if (PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/login";
      redirect.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirect);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── maintenance gate ──────────────────────────────────────
  // public read of the switch; signed-in admins walk straight through
  const path = request.nextUrl.pathname;
  const exempt = MAINTENANCE_EXEMPT.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  if (!exempt) {
    try {
      const res = await fetch(
        `${url}/rest/v1/site_settings?key=eq.maintenance&select=value`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ value?: { on?: boolean } }>;
        if (rows[0]?.value?.on) {
          let isAdmin = false;
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("is_admin")
              .eq("id", user.id)
              .maybeSingle();
            isAdmin = Boolean(profile?.is_admin);
          }
          if (!isAdmin) {
            const redirect = request.nextUrl.clone();
            redirect.pathname = "/maintenance";
            redirect.search = "";
            return NextResponse.redirect(redirect);
          }
        }
      }
    } catch {
      // settings unreachable — the market stays open
    }
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!user && isProtected) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.search = "";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPage) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/account";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
