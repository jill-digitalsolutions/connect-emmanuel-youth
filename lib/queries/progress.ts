import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { EnrollmentStatus } from "@/lib/types/database.types";

export interface ProgressRow {
  userId: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  status: EnrollmentStatus;
  done: number;
  lastAt: string | null;
}
export interface CourseProgress {
  id: string;
  title: string;
  track: string;
  total: number;
  rows: ProgressRow[];
}

// Admin overview: every training with everyone enrolled and how far along they are.
export async function getProgressOverview(): Promise<CourseProgress[]> {
  const supabase = await getServerClient();
  const [courses, topics, enrollments, completions, profiles] = await Promise.all([
    supabase.from("courses").select("id, title, track").order("created_at"),
    supabase.from("course_topics").select("course_id"),
    supabase.from("course_enrollments").select("course_id, user_id, status"),
    supabase.from("topic_completions").select("course_id, user_id, completed_at"),
    supabase.from("profiles").select("id, name, username, avatar_url"),
  ]);

  const people = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  const totals = new Map<string, number>();
  for (const t of topics.data ?? []) totals.set(t.course_id, (totals.get(t.course_id) ?? 0) + 1);

  const done = new Map<string, { n: number; last: string }>();
  for (const c of completions.data ?? []) {
    const key = `${c.course_id}|${c.user_id}`;
    const cur = done.get(key);
    done.set(key, { n: (cur?.n ?? 0) + 1, last: cur && cur.last > c.completed_at ? cur.last : c.completed_at });
  }

  return (courses.data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    track: c.track,
    total: totals.get(c.id) ?? 0,
    rows: (enrollments.data ?? [])
      .filter((e) => e.course_id === c.id && e.status !== "declined")
      .flatMap((e) => {
        const p = people.get(e.user_id);
        if (!p) return [];
        const d = done.get(`${c.id}|${e.user_id}`);
        return [{
          userId: p.id, name: p.name, username: p.username, avatar_url: p.avatar_url,
          status: e.status, done: d?.n ?? 0, lastAt: d?.last ?? null,
        }];
      })
      .sort((a, b) => b.done - a.done || a.name.localeCompare(b.name)),
  }));
}
