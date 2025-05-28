import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL for admin client");
}
// Log a warning if the service role key is missing, but don't throw an error immediately
// as the getSupabaseAdmin function will handle returning null.
if (!supabaseServiceRoleKey) {
  console.warn("Missing env.SUPABASE_SERVICE_ROLE_KEY for admin client. Admin operations might fail or use a null client.");
}

// Initialize supabaseAdmin, it can be null if the service key is not provided.
let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
} else {
    console.error("Supabase admin client could not be initialized at module load due to missing URL or Service Role Key.");
}

/**
 * Returns the Supabase admin client instance.
 * If the client was not initialized at module load (e.g. env vars not present then),
 * it attempts to initialize it. Returns null if essential env vars are missing.
 */
export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!supabaseAdmin) {
    // Attempt to re-initialize if null, in case env vars became available
    // or to ensure a clear error/warning if still missing.
    const currentServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (currentUrl && currentServiceKey) {
      console.log("Attempting to re-initialize Supabase admin client in getSupabaseAdmin().");
      supabaseAdmin = createClient(currentUrl, currentServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    } else {
      console.error("Supabase admin client cannot be initialized - URL or Service Role Key is missing from environment variables.");
      return null; // Explicitly return null if it cannot be initialized
    }
  }
  return supabaseAdmin;
}; 