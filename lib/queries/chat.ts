import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { ChatMessage } from "@/lib/types/database.types";

// Newest first; the client renders them bottom-up like a normal chat.
export async function getChatMessages(): Promise<ChatMessage[]> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}
