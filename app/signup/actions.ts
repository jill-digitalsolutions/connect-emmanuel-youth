"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usernameEmail } from "@/lib/utils/username-email";

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !username || !password) {
    redirect(`/signup?error=${encodeURIComponent("Fill in your name, username, and password.")}`);
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    redirect(
      `/signup?error=${encodeURIComponent("Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.")}`
    );
  }

  const supabase = await createClient();

  const { data: taken } = await supabase.rpc("username_taken", { p_username: username });
  if (taken) {
    redirect(`/signup?error=${encodeURIComponent("That username is already taken.")}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email: usernameEmail(username),
    password,
    options: { data: { full_name: name, username } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    // Only happens if "Confirm email" is still on in Supabase.
    redirect(`/signup?error=${encodeURIComponent("Account created, but sign-in is blocked until an admin turns off “Confirm email” in Supabase.")}`);
  }

  redirect("/home");
}
