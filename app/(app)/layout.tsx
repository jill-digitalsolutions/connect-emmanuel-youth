import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CurrentUserProvider } from "@/lib/context/CurrentUserContext";
import { AppShell } from "@/components/layout/AppShell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const resolvedProfile = profile ?? {
    id: user.id,
    name: user.email?.split("@")[0] ?? "Member",
    avatar_url: null,
    role: "member" as const,
    created_at: new Date().toISOString(),
  };

  return (
    <CurrentUserProvider profile={resolvedProfile}>
      <AppShell>{children}</AppShell>
    </CurrentUserProvider>
  );
}
