"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRealProfile, getServerClient } from "@/lib/supabase/session";

// `edit` keeps the page in edit mode (used while adding several ministries).
function back(id: string, kind: "notice" | "error", message: string, edit = false): never {
  redirect(`/members/${id}?${kind}=${encodeURIComponent(message)}${edit ? "&edit=1" : ""}`);
}

async function requireAdmin(id: string) {
  const me = await getRealProfile();
  if (!me || me.role !== "admin") back(id, "error", "Only admins can change ministries.");
  return me;
}

export async function saveAddress(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const me = await getRealProfile();
  if (!me || (me.id !== userId && me.role !== "admin")) back(userId, "error", "Not allowed.");
  const address = String(formData.get("address") ?? "").trim().slice(0, 300);
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("profile_private")
    .upsert({ user_id: userId, address: address || null, updated_at: new Date().toISOString() });
  if (error) back(userId, "error", /profile_private/.test(error.message) ? "Run the profile SQL (0015) in Supabase first." : error.message);
  revalidatePath(`/members/${userId}`);
  back(userId, "notice", "Address saved.");
}

export async function assignMinistry(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  await requireAdmin(userId);
  const name = String(formData.get("ministry") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() || "Member";
  if (!name) back(userId, "error", "Choose or type a ministry.", true);

  const supabase = await getServerClient();
  // Reuse an existing ministry with this name (any capitalisation), else create it.
  const { data: existing } = await supabase.from("ministries").select("id").ilike("name", name).maybeSingle();
  let ministryId = existing?.id;
  if (!ministryId) {
    const { data: created, error } = await supabase.from("ministries").insert({ name }).select("id").single();
    if (error) back(userId, "error", /ministries/.test(error.message) ? "Run the profile SQL (0015) in Supabase first." : error.message);
    ministryId = created!.id;
  }
  const { error } = await supabase
    .from("ministry_members")
    .upsert({ ministry_id: ministryId, user_id: userId, role }, { onConflict: "ministry_id,user_id" });
  if (error) back(userId, "error", error.message, true);
  revalidatePath(`/members/${userId}`);
  back(userId, "notice", `Saved: ${name} — ${role}.`, true);
}

export async function removeMinistry(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  await requireAdmin(userId);
  const id = String(formData.get("id") ?? "");
  const supabase = await getServerClient();
  const { error } = await supabase.from("ministry_members").delete().eq("id", id).eq("user_id", userId);
  if (error) back(userId, "error", error.message);
  revalidatePath(`/members/${userId}`);
  back(userId, "notice", "Removed from ministry.", true);
}
