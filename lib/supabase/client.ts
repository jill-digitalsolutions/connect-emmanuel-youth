import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

// A single shared client per browser tab, not a fresh one per call. Each
// client owns its own Realtime WebSocket connection, so creating one ad hoc
// in every component/hook (e.g. every useRealtimeTable subscription) opens
// redundant sockets and can leave a given channel's events undelivered to
// whichever instance the UI is actually reading state from.
let browserClient: SupabaseClient<Database> | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
