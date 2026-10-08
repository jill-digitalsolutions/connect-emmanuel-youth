import { getMembersOverview } from "@/lib/queries/members";
import { MembersClient } from "@/components/members/MembersClient";

export default async function MembersPage() {
  return <MembersClient members={await getMembersOverview()} />;
}
