import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { Course, Profile } from "@/lib/types/database.types";

export interface MemberDetail {
  profile: Profile;
  address: string | null;
  ministries: { id: string; ministry_id: string; name: string; role: string }[];
  trainings: (Course & { modules_done: number })[];
  allMinistries: { id: string; name: string }[];
}

// Tables from the profile migration may not exist yet; a failed query just
// yields an empty list so the page still renders.
export async function getMemberDetail(userId: string): Promise<MemberDetail | null> {
  const supabase = await getServerClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return null;

  const [memberships, allMinistries, privateRow, progress, courses] = await Promise.all([
    supabase.from("ministry_members").select("id, ministry_id, role").eq("user_id", userId),
    supabase.from("ministries").select("id, name").order("name"),
    supabase.from("profile_private").select("address").eq("user_id", userId).maybeSingle(),
    supabase.from("course_progress").select("course_id, modules_done").eq("user_id", userId),
    supabase.from("courses").select("*"),
  ]);

  const ministryName = new Map((allMinistries.data ?? []).map((m) => [m.id, m.name]));
  const courseById = new Map((courses.data ?? []).map((c) => [c.id, c]));

  return {
    profile,
    address: privateRow.data?.address ?? null,
    ministries: (memberships.data ?? [])
      .map((m) => ({ ...m, name: ministryName.get(m.ministry_id) ?? "Ministry" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    trainings: (progress.data ?? [])
      .map((p) => {
        const c = courseById.get(p.course_id);
        return c ? { ...c, modules_done: p.modules_done } : null;
      })
      .filter((c): c is Course & { modules_done: number } => c !== null),
    allMinistries: allMinistries.data ?? [],
  };
}
