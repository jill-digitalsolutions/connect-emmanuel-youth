import { redirect } from "next/navigation";
import { getUserId, getProfile } from "@/lib/supabase/session";
import { CurrentUserProvider } from "@/lib/context/CurrentUserContext";
import { AppShell } from "@/components/layout/AppShell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const profile = await getProfile();

  const resolvedProfile = profile ?? {
    id: userId,
    name: "Member",
    username: null,
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
