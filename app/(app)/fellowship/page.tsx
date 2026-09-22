import { getSessions } from "@/lib/queries/sessions";
import { FellowshipClient } from "@/components/fellowship/FellowshipClient";

export default async function FellowshipPage() {
  const sessions = await getSessions();
  return <FellowshipClient initialSessions={sessions} />;
}
