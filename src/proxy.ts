import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "propertydocz.com";

function getTenantSlug(hostname: string): string | null {
  // Local dev: check for tenant slug in query param or subdomain of localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  // Production: extract subdomain from *.propertydocz.com
  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const slug = hostname.replace(`.${APP_DOMAIN}`, "");
    // Ignore www and empty slugs
    if (slug && slug !== "www") {
      return slug;
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] || "";
  const tenantSlug = getTenantSlug(hostname);
  const { pathname } = request.nextUrl;

  // Public routes — pass through without auth checks
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/success" ||
    pathname === "/pricing" ||
    pathname === "/how-it-works" ||
    pathname === "/for-management-companies" ||
    pathname === "/for-agents" ||
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/stripe/webhook")
  ) {
    const response = NextResponse.next();
    if (tenantSlug) {
      response.headers.set("x-tenant-slug", tenantSlug);
    }
    return response;
  }

  // Create a response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Refresh Supabase auth session (only for routes that need it)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Supabase not configured — let the request through
    if (tenantSlug) {
      response.headers.set("x-tenant-slug", tenantSlug);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set tenant slug header for downstream use
  if (tenantSlug) {
    response.headers.set("x-tenant-slug", tenantSlug);
  }

  // Admin routes require authentication
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Platform routes require authentication
  if (pathname.startsWith("/platform")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
