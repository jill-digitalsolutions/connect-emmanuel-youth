import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/home`);
    }
  }

  // Supabase confirms the email before redirecting here, so a failed code
  // exchange (e.g. link opened on a different device than the signup) usually
  // still means the account is confirmed.
  return NextResponse.redirect(`${origin}/login?notice=confirmed`);
}
