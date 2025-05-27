import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("Missing env.SUPABASE_URL for admin client. Realtime broadcasting will be skipped.");
}
if (!supabaseServiceKey) {
  console.warn("Missing env.SUPABASE_SERVICE_ROLE_KEY for admin client. Realtime broadcasting will be skipped.");
}

let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null; // Return null if config is missing, so consuming code can handle it gracefully
  }
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
}; 