import { getChatMessages } from "@/lib/queries/chat";
import { getAllProfiles } from "@/lib/queries/profiles";
import { toProfileMap } from "@/lib/utils/profiles";
import { ChatClient } from "@/components/messages/ChatClient";

export default async function MessagesPage() {
  const [messages, profiles] = await Promise.all([getChatMessages(), getAllProfiles()]);
  return <ChatClient initialMessages={messages} profilesById={toProfileMap(profiles)} />;
}
