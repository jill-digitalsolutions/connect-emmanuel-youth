import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/session";

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // If Supabase's Site URL is the bare domain, auth emails (confirm email,
  // magic links) arrive here with ?code=... — hand them to the callback.
  const { code } = await searchParams;
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}`);

  redirect((await getUserId()) ? "/home" : "/login");
}
