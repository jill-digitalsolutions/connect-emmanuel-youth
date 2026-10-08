"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usernameEmail } from "@/lib/utils/username-email";

const INVALID = "Invalid login credentials";

export async function login(formData: FormData) {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your username (or email) and password.")}`);
  }

  const supabase = await createClient();

  // Supabase Auth signs in by email; username accounts use a stand-in address.
  let email = identifier.toLowerCase();
  if (!identifier.includes("@")) email = usernameEmail(identifier);

  let { error } = await supabase.auth.signInWithPassword({ email, password });

  // Older accounts created with a real email still resolve through the
  // lookup until the privacy migration (0014) has been run.
  if (error && !identifier.includes("@")) {
    const { data: legacy } = await supabase.rpc("login_email_for_username", { p_username: identifier });
    if (legacy && legacy !== email) ({ error } = await supabase.auth.signInWithPassword({ email: legacy, password }));
  }

  if (error) {
    // One generic message for every failure, so the form never reveals which
    // usernames exist or whether an account is pending/unconfirmed.
    const limited = /rate limit|too many/i.test(error.message);
    redirect(`/login?error=${encodeURIComponent(limited ? "Too many attempts. Please wait a few minutes." : INVALID)}`);
  }

  redirect("/home");
}
