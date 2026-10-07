import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { ChatMessage, ChatReaction } from "@/lib/types/database.types";

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

export async function getChatReactions(): Promise<ChatReaction[]> {
  const supabase = await getServerClient();
  const { data } = await supabase.from("chat_reactions").select("*").limit(3000);
  // Table may not exist until the reactions SQL has been run.
  return data ?? [];
}
