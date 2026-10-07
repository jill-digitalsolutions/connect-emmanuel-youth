import { getChatMessages, getChatReactions } from "@/lib/queries/chat";
import { getAllProfiles } from "@/lib/queries/profiles";
import { toProfileMap } from "@/lib/utils/profiles";
import { ChatClient } from "@/components/messages/ChatClient";

export default async function MessagesPage() {
  const [messages, reactions, profiles] = await Promise.all([getChatMessages(), getChatReactions(), getAllProfiles()]);
  return <ChatClient initialMessages={messages} initialReactions={reactions} profilesById={toProfileMap(profiles.filter((p) => p.approved !== false))} />;
}
