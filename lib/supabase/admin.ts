import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Server-only client that bypasses row-level security. Used for sending push
// notifications and scheduled reminders; never import this from client code.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
