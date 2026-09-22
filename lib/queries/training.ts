import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types/database.types";

export interface CourseWithProgress extends Course {
  modules_done: number;
}

export async function getCoursesForUser(userId: string): Promise<CourseWithProgress[]> {
  const supabase = await createClient();
  const [coursesRes, progressRes] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: true }),
    supabase.from("course_progress").select("course_id, modules_done").eq("user_id", userId),
  ]);

  const progressByCourse = new Map(progressRes.data?.map((p) => [p.course_id, p.modules_done]) ?? []);

  return (coursesRes.data ?? []).map((c) => ({
    ...c,
    modules_done: progressByCourse.get(c.id) ?? 0,
  }));
}
