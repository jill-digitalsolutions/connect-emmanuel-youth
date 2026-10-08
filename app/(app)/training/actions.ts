"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRealProfile, getServerClient } from "@/lib/supabase/session";

function back(path: string, kind: "notice" | "error", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

async function requireAdmin(path: string) {
  const me = await getRealProfile();
  if (!me || me.role !== "admin") back(path, "error", "Only admins can do that.");
  return me!;
}

const SETUP = "Run the training SQL (0016) in Supabase first.";
const msg = (m: string) => (/course_|topic_|enrollments/.test(m) ? SETUP : m);

export async function requestEnrollment(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/training");
  const me = await getRealProfile();
  if (!me) redirect("/login");
  const supabase = await getServerClient();
  // A declined request can be sent again.
  await supabase.from("course_enrollments").delete().eq("course_id", courseId).eq("user_id", me.id).eq("status", "declined");
  const { error } = await supabase.from("course_enrollments").insert({ course_id: courseId, user_id: me.id, status: "pending" });
  if (error && !/duplicate/i.test(error.message)) back(returnTo, "error", msg(error.message));
  revalidatePath("/training");
  back(returnTo, "notice", "Request sent. An admin will approve it.");
}

export async function cancelEnrollment(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/training");
  const me = await getRealProfile();
  if (!me) redirect("/login");
  const supabase = await getServerClient();
  await supabase.from("course_enrollments").delete().eq("course_id", courseId).eq("user_id", me.id).eq("status", "pending");
  revalidatePath("/training");
  back(returnTo, "notice", "Request cancelled.");
}

export async function decideEnrollment(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/training");
  await requireAdmin(returnTo);
  const id = String(formData.get("id") ?? "");
  const approve = formData.get("decision") === "approve";
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("course_enrollments")
    .update({ status: approve ? "approved" : "declined", decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) back(returnTo, "error", msg(error.message));
  revalidatePath("/training");
  back(returnTo, "notice", approve ? "Enrollment approved." : "Request declined.");
}

export async function addCourse(formData: FormData) {
  await requireAdmin("/training");
  const title = String(formData.get("title") ?? "").trim();
  const track = String(formData.get("track") ?? "Leadership");
  if (!title) back("/training", "error", "Add a course title.");
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({ title, track: track as "Leadership", total_modules: 1 })
    .select("id")
    .single();
  if (error) back("/training", "error", error.message);
  revalidatePath("/training");
  redirect(`/training/${data!.id}?edit=1&notice=${encodeURIComponent("Course created. Add modules and topics below.")}`);
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin("/training");
  const id = String(formData.get("courseId") ?? "");
  const supabase = await getServerClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) back("/training", "error", error.message);
  revalidatePath("/training");
  back("/training", "notice", "Course deleted.");
}

export async function addModule(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const path = `/training/${courseId}?edit=1`;
  await requireAdmin(path);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) back(path, "error", "Add a module title.");
  const supabase = await getServerClient();
  const { data: last } = await supabase.from("course_modules").select("position").eq("course_id", courseId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("course_modules").insert({ course_id: courseId, title, position: (last?.position ?? 0) + 1 });
  if (error) back(path, "error", msg(error.message));
  revalidatePath(`/training/${courseId}`);
  back(path, "notice", "Module added.");
}

export async function addTopic(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  const path = `/training/${courseId}?edit=1`;
  await requireAdmin(path);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) back(path, "error", "Add a topic title.");
  const supabase = await getServerClient();
  const { data: last } = await supabase.from("course_topics").select("position").eq("module_id", moduleId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("course_topics").insert({ course_id: courseId, module_id: moduleId, title, position: (last?.position ?? 0) + 1 });
  if (error) back(path, "error", msg(error.message));
  revalidatePath(`/training/${courseId}`);
  back(path, "notice", "Topic added.");
}

export async function deleteModule(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const path = `/training/${courseId}?edit=1`;
  await requireAdmin(path);
  const supabase = await getServerClient();
  const { error } = await supabase.from("course_modules").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) back(path, "error", error.message);
  revalidatePath(`/training/${courseId}`);
  back(path, "notice", "Module removed.");
}

export async function deleteTopic(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const path = `/training/${courseId}?edit=1`;
  await requireAdmin(path);
  const supabase = await getServerClient();
  const id = String(formData.get("id") ?? "");
  const { data: t } = await supabase.from("course_topics").select("pdf_path").eq("id", id).maybeSingle();
  if (t?.pdf_path) await supabase.storage.from("lessons").remove([t.pdf_path]);
  const { error } = await supabase.from("course_topics").delete().eq("id", id);
  if (error) back(path, "error", error.message);
  revalidatePath(`/training/${courseId}`);
  back(path, "notice", "Topic removed.");
}

// Opens the member's next locked lesson without them finishing the one before.
export async function unlockNext(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const path = `/training/${courseId}`;
  await requireAdmin(path);
  const supabase = await getServerClient();

  const [modules, topics, done, unlocks] = await Promise.all([
    supabase.from("course_modules").select("id, position").eq("course_id", courseId),
    supabase.from("course_topics").select("id, module_id, position").eq("course_id", courseId),
    supabase.from("topic_completions").select("topic_id").eq("user_id", userId).eq("course_id", courseId),
    supabase.from("topic_unlocks").select("topic_id").eq("user_id", userId),
  ]);
  const modulePos = new Map((modules.data ?? []).map((m) => [m.id, m.position]));
  const ordered = [...(topics.data ?? [])].sort(
    (a, b) => (modulePos.get(a.module_id) ?? 0) - (modulePos.get(b.module_id) ?? 0) || a.position - b.position
  );
  const doneSet = new Set((done.data ?? []).map((d) => d.topic_id));
  const openSet = new Set((unlocks.data ?? []).map((u) => u.topic_id));
  const next = ordered.find((t, i) => !doneSet.has(t.id) && !openSet.has(t.id) && i > 0 && !doneSet.has(ordered[i - 1].id));
  if (!next) back(path, "notice", "Nothing left to unlock for this member.");
  const { error } = await supabase.from("topic_unlocks").insert({ user_id: userId, topic_id: next!.id });
  if (error) back(path, "error", msg(error.message));
  revalidatePath(path);
  back(path, "notice", "Next lesson unlocked for this member.");
}

export async function renameModule(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const path = `/training/${courseId}?edit=1`;
  await requireAdmin(path);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) back(path, "error", "A module needs a title.");
  const supabase = await getServerClient();
  const { error } = await supabase.from("course_modules").update({ title }).eq("id", String(formData.get("id") ?? ""));
  if (error) back(path, "error", error.message);
  revalidatePath(`/training/${courseId}`);
  back(path, "notice", "Module renamed.");
}

export async function renameTopic(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const path = `/training/${courseId}?edit=1`;
  await requireAdmin(path);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) back(path, "error", "A topic needs a title.");
  const supabase = await getServerClient();
  const { error } = await supabase.from("course_topics").update({ title }).eq("id", String(formData.get("id") ?? ""));
  if (error) back(path, "error", error.message);
  revalidatePath(`/training/${courseId}`);
  back(path, "notice", "Topic renamed.");
}

export async function renameCourse(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const path = `/training/${courseId}?edit=1`;
  await requireAdmin(path);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) back(path, "error", "A course needs a title.");
  const supabase = await getServerClient();
  const { error } = await supabase.from("courses").update({ title }).eq("id", courseId);
  if (error) back(path, "error", error.message);
  revalidatePath(`/training/${courseId}`);
  back(path, "notice", "Course renamed.");
}
