import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import { getMemberTrainings } from "@/lib/queries/training";
import type { Profile } from "@/lib/types/database.types";

export interface MemberDetail {
  profile: Profile;
  address: string | null;
  ministries: { id: string; ministry_id: string; name: string; role: string }[];
  trainings: { id: string; title: string; track: string; done: number; total: number }[];
  allMinistries: { id: string; name: string }[];
}

// Tables from the profile migration may not exist yet; a failed query just
// yields an empty list so the page still renders.
export async function getMemberDetail(userId: string): Promise<MemberDetail | null> {
  const supabase = await getServerClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return null;

  const [memberships, allMinistries, privateRow, trainings] = await Promise.all([
    supabase.from("ministry_members").select("id, ministry_id, role").eq("user_id", userId),
    supabase.from("ministries").select("id, name").order("name"),
    supabase.from("profile_private").select("address").eq("user_id", userId).maybeSingle(),
    getMemberTrainings(userId),
  ]);

  const ministryName = new Map((allMinistries.data ?? []).map((m) => [m.id, m.name]));

  return {
    profile,
    address: privateRow.data?.address ?? null,
    ministries: (memberships.data ?? [])
      .map((m) => ({ ...m, name: ministryName.get(m.ministry_id) ?? "Ministry" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    trainings,
    allMinistries: allMinistries.data ?? [],
  };
}
