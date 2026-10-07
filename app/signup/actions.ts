"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !username || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Fill in your name, username, email, and password.")}`);
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    redirect(
      `/signup?error=${encodeURIComponent("Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.")}`
    );
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  const supabase = await createClient();

  const { data: taken } = await supabase.rpc("login_email_for_username", { p_username: username });
  if (taken) {
    redirect(`/signup?error=${encodeURIComponent("That username is already taken.")}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, username },
      emailRedirectTo: `${proto}://${host}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    // Email confirmation is required before a session exists.
    redirect("/login?notice=check-email");
  }

  redirect("/home");
}
