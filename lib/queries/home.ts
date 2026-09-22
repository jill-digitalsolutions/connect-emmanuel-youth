import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayIso, addDaysIso } from "@/lib/utils/dates";
import type { Post, CalendarEvent, FellowshipSession } from "@/lib/types/database.types";

export interface HomeData {
  postsThisMonth: number;
  activeCourses: number;
  upcomingSessions: number;
  openTasks: number;
  nextSession: FellowshipSession | null;
  latestPost: Post | null;
  weekEvents: CalendarEvent[];
}

export async function getHomeData(userId: string): Promise<HomeData> {
  const supabase = await createClient();
  const today = todayIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekEnd = addDaysIso(7);

  const [
    postsThisMonthRes,
    coursesRes,
    progressRes,
    upcomingSessionsRes,
    openTasksRes,
    nextSessionRes,
    latestPostRes,
    weekEventsRes,
  ] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    supabase.from("courses").select("id, total_modules"),
    supabase.from("course_progress").select("course_id, modules_done").eq("user_id", userId),
    supabase.from("sessions").select("id", { count: "exact", head: true }).gte("date", today),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "done"),
    supabase.from("sessions").select("*").gte("date", today).order("date", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("events").select("*").gte("date", today).lte("date", weekEnd).order("date", { ascending: true }),
  ]);

  const progressByCourse = new Map(progressRes.data?.map((p) => [p.course_id, p.modules_done]) ?? []);
  const activeCourses = (coursesRes.data ?? []).filter(
    (c) => (progressByCourse.get(c.id) ?? 0) < c.total_modules
  ).length;

  return {
    postsThisMonth: postsThisMonthRes.count ?? 0,
    activeCourses,
    upcomingSessions: upcomingSessionsRes.count ?? 0,
    openTasks: openTasksRes.count ?? 0,
    nextSession: nextSessionRes.data,
    latestPost: latestPostRes.data,
    weekEvents: weekEventsRes.data ?? [],
  };
}
