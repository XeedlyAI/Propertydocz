/**
 * Supabase client factories — @xeedlyai/kit.
 *
 * Three clients, one place for the cookie plumbing. Each app keeps a thin
 * wrapper in src/lib/supabase/ that reads its own env and calls one of these,
 * so call sites never change and the SSR cookie contract is not copied five
 * times.
 *
 *   createBrowserSupabase(url, anonKey)            client components — RLS as the user
 *   createServerSupabase(url, anonKey, cookies)    RSC, route handlers, server actions — RLS as the user
 *   createAdminSupabase(url, serviceRoleKey)       cron, webhooks, trusted admin work — BYPASSES RLS
 *
 * The admin factory throws when the service-role key is missing so a
 * misconfigured deploy fails at the first privileged call, not silently as
 * an anon client. Never import it from anything that ships to the browser.
 */
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** The subset of Next's cookie store the server client needs (works with `await cookies()`). */
export interface CookieStoreLike {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
}

/**
 * supabase-js expects the bare project URL; tolerate a pasted REST URL
 * (https://xyz.supabase.co/rest/v1/) by stripping the path.
 */
export function projectUrl(raw: string): string {
  if (!raw) return raw;
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}

// supabase-js's own generic defaults to `any` so untyped apps can query any
// table; we mirror that default. Typed apps pass their generated Database.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;

export function createBrowserSupabase<Db = AnyDb>(url: string, anonKey: string) {
  return createBrowserClient<Db>(projectUrl(url), anonKey);
}

export function createServerSupabase<Db = AnyDb>(url: string, anonKey: string, cookieStore: CookieStoreLike) {
  return createServerClient<Db>(projectUrl(url), anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options as Record<string, unknown>);
        } catch {
          // Called from a Server Component, where the cookie store is read-only.
          // The app's proxy/middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

export function createAdminSupabase<Db = AnyDb>(url: string, serviceRoleKey: string | undefined): SupabaseClient<Db> {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. The admin client cannot be constructed.");
  }
  return createClient<Db>(projectUrl(url), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
