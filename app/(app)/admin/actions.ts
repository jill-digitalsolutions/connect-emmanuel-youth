"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { usernameEmail } from "@/lib/utils/username-email";
import { getRealProfile, getServerClient, VIEW_AS_COOKIE } from "@/lib/supabase/session";
import type { Database } from "@/lib/types/database.types";

function back(kind: "notice" | "error", message: string): never {
  redirect(`/admin?${kind}=${encodeURIComponent(message)}`);
}

async function requireAdmin() {
  const me = await getRealProfile();
  if (!me || me.role !== "admin") redirect("/home");
  return me;
}

export async function createAccount(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || usernameEmail(username);
  const password = String(formData.get("password") ?? "");
  const makeAdmin = formData.get("admin") === "on";

  if (!name || !username || !password) back("error", "Fill in name, username and password.");
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    back("error", "Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.");
  }
  if (password.length < 6) back("error", "Password must be at least 6 characters.");

  const supabase = await getServerClient();
  const { data: taken } = await supabase.rpc("login_email_for_username", { p_username: username });
  if (taken) back("error", "That username is already taken.");

  // A throwaway client that never stores a session, so creating someone
  // else's account doesn't sign the admin out / in as them.
  const signupClient = createAnonClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { data, error } = await signupClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, username } },
  });

  if (error) back("error", error.message);
  if (!data.user || data.user.identities?.length === 0) back("error", "An account with that email already exists.");

  let note = `Account created. They can log in with username “${username}” and the password you set.`;
  if (!data.session) {
    note += " Email confirmation is on in Supabase, so they must confirm first (or turn off “Confirm email” in Supabase).";
  }

  // Accounts an admin creates are approved right away.
  await supabase.from("profiles").update({ approved: true }).eq("id", data.user.id);

  if (makeAdmin) {
    const { data: updated } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", data.user.id)
      .select("id");
    note += updated?.length
      ? " They are an admin."
      : " Could not make them admin yet — run the 0008 migration SQL, then use the Make admin button.";
  }

  revalidatePath("/admin");
  back("notice", note);
}

export async function setRole(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "member";

  if (userId === me.id) back("error", "You can't change your own role.");

  const supabase = await getServerClient();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id");

  if (error) back("error", error.message);
  if (!updated?.length) back("error", "Role change was blocked. Run the 0008 migration SQL in Supabase first.");

  revalidatePath("/admin");
  back("notice", role === "admin" ? "Made admin." : "Removed admin.");
}

export async function approveMember(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const supabase = await getServerClient();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ approved: true })
    .eq("id", userId)
    .select("id");
  if (error) back("error", error.message);
  if (!updated?.length) back("error", "Could not approve. Run the member-approval SQL (0012) in Supabase first.");
  revalidatePath("/admin");
  back("notice", "Approved. They can now log in.");
}

export async function viewAsMember() {
  await requireAdmin();
  (await cookies()).set(VIEW_AS_COOKIE, "member", { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/home");
}

export async function viewAsAdmin() {
  (await cookies()).delete(VIEW_AS_COOKIE);
  redirect("/admin");
}
