import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { Course, CourseTrack, EnrollmentStatus, Profile } from "@/lib/types/database.types";

export interface CourseCardData {
  course: Course;
  modules: number;
  topics: number;
  status: EnrollmentStatus | "none";
  done: number; // topics this member has finished
}

export interface EnrollmentRequest {
  id: string;
  course_id: string;
  course_title: string;
  user: { id: string; name: string; username: string | null; avatar_url: string | null };
}

export interface Catalog {
  cards: CourseCardData[];
  requests: EnrollmentRequest[]; // pending, admins only (RLS hides others')
}

export async function getTrainingCatalog(userId: string): Promise<Catalog> {
  const supabase = await getServerClient();
  const [courses, modules, topics, enrollments, completions, profiles] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: true }),
    supabase.from("course_modules").select("id, course_id"),
    supabase.from("course_topics").select("id, course_id"),
    supabase.from("course_enrollments").select("id, course_id, user_id, status"),
    supabase.from("topic_completions").select("course_id").eq("user_id", userId),
    supabase.from("profiles").select("id, name, username, avatar_url"),
  ]);

  const count = (rows: { course_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.course_id, (m.get(r.course_id) ?? 0) + 1);
    return m;
  };
  const moduleCount = count(modules.data);
  const topicCount = count(topics.data);
  const doneCount = count(completions.data);
  const mine = new Map(
    (enrollments.data ?? []).filter((e) => e.user_id === userId).map((e) => [e.course_id, e.status])
  );

  const cards = (courses.data ?? []).map((course) => ({
    course,
    modules: moduleCount.get(course.id) ?? 0,
    topics: topicCount.get(course.id) ?? 0,
    status: (mine.get(course.id) ?? "none") as CourseCardData["status"],
    done: doneCount.get(course.id) ?? 0,
  }));

  const courseTitle = new Map((courses.data ?? []).map((c) => [c.id, c.title]));
  const people = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  const requests = (enrollments.data ?? [])
    .filter((e) => e.status === "pending" && e.user_id !== userId)
    .flatMap((e) => {
      const user = people.get(e.user_id);
      return user ? [{ id: e.id, course_id: e.course_id, course_title: courseTitle.get(e.course_id) ?? "Training", user }] : [];
    });

  return { cards, requests };
}

export interface TopicRow {
  id: string;
  module_id: string;
  position: number;
  title: string;
  pdf_name: string | null;
  hasPdf: boolean;
  // Only filled in for lessons that are open to the viewer.
  pdf_path: string | null;
  youtube_url: string | null;
}
export interface ModuleRow {
  id: string;
  position: number;
  title: string;
  topics: TopicRow[];
}
export interface RosterEntry {
  enrollmentId: string;
  status: EnrollmentStatus;
  user: Pick<Profile, "id" | "name" | "username" | "avatar_url">;
  done: number;
}
export interface CourseDetail {
  course: Course;
  modules: ModuleRow[];
  totalTopics: number;
  status: EnrollmentStatus | "none";
  completed: string[]; // topic ids this member finished
  unlocked: string[]; // topic ids an admin opened for this member
  roster: RosterEntry[]; // approved + pending members (visible to everyone, requests only to admins)
  track: CourseTrack;
}

export async function getCourseDetail(courseId: string, userId: string, isAdmin = false): Promise<CourseDetail | null> {
  const supabase = await getServerClient();
  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
  if (!course) return null;

  const [modules, topics, enrollments, completions, unlocks, profiles] = await Promise.all([
    supabase.from("course_modules").select("*").eq("course_id", courseId).order("position"),
    supabase.from("course_topics").select("*").eq("course_id", courseId).order("position"),
    supabase.from("course_enrollments").select("id, user_id, status").eq("course_id", courseId),
    supabase.from("topic_completions").select("user_id, topic_id").eq("course_id", courseId),
    supabase.from("topic_unlocks").select("user_id, topic_id").eq("user_id", userId),
    supabase.from("profiles").select("id, name, username, avatar_url"),
  ]);

  const completedIds = new Set((completions.data ?? []).filter((c) => c.user_id === userId).map((c) => c.topic_id));
  const unlockedIds = new Set((unlocks.data ?? []).map((u) => u.topic_id));
  const approved = isAdmin || (enrollments.data ?? []).some((e) => e.user_id === userId && e.status === "approved");
  const modulePos = new Map((modules.data ?? []).map((m) => [m.id, m.position]));
  const ordered = [...(topics.data ?? [])].sort(
    (a, b) => (modulePos.get(a.module_id) ?? 0) - (modulePos.get(b.module_id) ?? 0) || a.position - b.position
  );
  // Same rule the database enforces: first lesson, previous one done, or admin-unlocked.
  const openIds = new Set(
    ordered
      .filter((t, i) => approved && (isAdmin || i === 0 || completedIds.has(ordered[i - 1].id) || unlockedIds.has(t.id)))
      .map((t) => t.id)
  );

  const rows: ModuleRow[] = (modules.data ?? []).map((m) => ({
    id: m.id,
    position: m.position,
    title: m.title,
    topics: (topics.data ?? [])
      .filter((t) => t.module_id === m.id)
      .map((t) => ({
        id: t.id,
        module_id: t.module_id,
        position: t.position,
        title: t.title,
        pdf_name: t.pdf_name,
        hasPdf: Boolean(t.pdf_path),
        pdf_path: openIds.has(t.id) ? t.pdf_path : null,
        youtube_url: openIds.has(t.id) ? t.youtube_url : null,
      })),
  }));

  const doneByUser = new Map<string, number>();
  for (const c of completions.data ?? []) doneByUser.set(c.user_id, (doneByUser.get(c.user_id) ?? 0) + 1);
  const people = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  const mine = (enrollments.data ?? []).find((e) => e.user_id === userId);

  return {
    course,
    track: course.track,
    modules: rows,
    totalTopics: topics.data?.length ?? 0,
    status: mine?.status ?? "none",
    completed: (completions.data ?? []).filter((c) => c.user_id === userId).map((c) => c.topic_id),
    unlocked: (unlocks.data ?? []).map((u) => u.topic_id),
    roster: (enrollments.data ?? []).flatMap((e) => {
      const user = people.get(e.user_id);
      return user ? [{ enrollmentId: e.id, status: e.status, user, done: doneByUser.get(e.user_id) ?? 0 }] : [];
    }),
  };
}

// For profile pages: courses a member is approved for and how far along they are.
export async function getMemberTrainings(userId: string) {
  const supabase = await getServerClient();
  const [enrollments, courses, topics, completions] = await Promise.all([
    supabase.from("course_enrollments").select("course_id").eq("user_id", userId).eq("status", "approved"),
    supabase.from("courses").select("id, title, track"),
    supabase.from("course_topics").select("course_id"),
    supabase.from("topic_completions").select("course_id").eq("user_id", userId),
  ]);
  const byId = new Map((courses.data ?? []).map((c) => [c.id, c]));
  const tally = (rows: { course_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.course_id, (m.get(r.course_id) ?? 0) + 1);
    return m;
  };
  const total = tally(topics.data);
  const done = tally(completions.data);
  return (enrollments.data ?? []).flatMap((e) => {
    const c = byId.get(e.course_id);
    return c ? [{ id: c.id, title: c.title, track: c.track, done: done.get(c.id) ?? 0, total: total.get(c.id) ?? 0 }] : [];
  });
}
