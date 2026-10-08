import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { Profile } from "@/lib/types/database.types";

export interface MemberCardData {
  profile: Profile;
  ministries: { name: string; role: string }[];
}

// The list shows names and ministries only; trainings and addresses live on
// each member's own profile page.
export async function getMembersOverview(): Promise<MemberCardData[]> {
  const supabase = await getServerClient();
  const [profiles, ministries, memberships] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("ministries").select("id, name"),
    supabase.from("ministry_members").select("ministry_id, user_id, role"),
  ]);

  const ministryName = new Map((ministries.data ?? []).map((m) => [m.id, m.name]));
  const ministriesByUser = new Map<string, MemberCardData["ministries"]>();
  for (const m of memberships.data ?? []) {
    const list = ministriesByUser.get(m.user_id) ?? [];
    list.push({ name: ministryName.get(m.ministry_id) ?? "Ministry", role: m.role });
    ministriesByUser.set(m.user_id, list);
  }

  return (profiles.data ?? [])
    .filter((p) => p.approved !== false)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((profile) => ({
      profile,
      ministries: (ministriesByUser.get(profile.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
