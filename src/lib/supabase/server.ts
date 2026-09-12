import { cookies } from "next/headers";
import { createAdminSupabase, createServerSupabase } from "@/kit/supabase";

export async function createClient() {
  return createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, await cookies());
}

/** Service-role client. Bypasses RLS — API routes and cross-tenant aggregation only. */
export async function createServiceClient() {
  return createAdminSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
