import { getAllProfiles } from "@/lib/queries/profiles";
import { MembersClient } from "@/components/members/MembersClient";

export default async function MembersPage() {
  const profiles = await getAllProfiles();
  const members = profiles
    .filter((p) => p.approved !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
  return <MembersClient members={members} />;
}
