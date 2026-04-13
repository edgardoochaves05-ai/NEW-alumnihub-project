import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

// Server-side client uses service role key for admin access
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Create a client scoped to a specific user's JWT (for RLS)
export function createUserClient(accessToken) {
  return createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
