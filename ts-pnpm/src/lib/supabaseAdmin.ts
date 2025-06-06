import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Using a variable in the module scope to cache the singleton instance.
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Returns a singleton instance of the Supabase admin client.
 * The client is initialized only on the first call and then cached.
 * Returns null if essential environment variables are missing.
 */
export const getSupabaseAdmin = (): SupabaseClient | null => {
  // If the client is already initialized, return the cached instance.
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate the presence of necessary environment variables.
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      'Supabase admin client cannot be initialized - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.',
    );
    return null;
  }

  // Initialize the client for the first time and cache it in the module scope.
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseAdmin;
}; 