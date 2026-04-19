import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("[SUPABASE] NEXT_PUBLIC_SUPABASE_URL is not configured. File uploads will not work.");
}

if (!supabaseServiceKey) {
  console.warn(
    "[SUPABASE] SUPABASE_SERVICE_ROLE_KEY is not configured. " +
    "Falling back to anon key is DISABLED for security reasons. " +
    "File uploads will not work until the service role key is set."
  );
}

/**
 * Server-side Supabase client using the service role key.
 * NEVER use the anon key for server-side operations — it grants
 * unauthenticated access to storage buckets.
 *
 * Returns null if Supabase is not properly configured.
 */
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const supabase = createSupabaseClient();

export const STORAGE_BUCKET = "media";

/**
 * Guard: throws if Supabase is not configured.
 * Call this before any storage operation.
 */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configuré. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return supabase;
}
