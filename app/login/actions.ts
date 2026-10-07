"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const INVALID = "Invalid login credentials";

export async function login(formData: FormData) {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your username (or email) and password.")}`);
  }

  const supabase = await createClient();

  // Supabase Auth signs in by email, so resolve a username to its email first.
  let email = identifier.toLowerCase();
  if (!identifier.includes("@")) {
    const { data } = await supabase.rpc("login_email_for_username", { p_username: identifier });
    if (!data) redirect(`/login?error=${encodeURIComponent(INVALID)}`);
    email = data;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/home");
}
