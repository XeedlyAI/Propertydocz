import { createBrowserSupabase } from "@/kit/supabase";

export function createClient() {
  return createBrowserSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
