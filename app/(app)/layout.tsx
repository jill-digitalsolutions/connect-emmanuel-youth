import { redirect } from "next/navigation";
import { getUserId, getProfile, isPreviewingAsMember } from "@/lib/supabase/session";
import { viewAsAdmin } from "./admin/actions";
import { CurrentUserProvider } from "@/lib/context/CurrentUserContext";
import { AppShell } from "@/components/layout/AppShell";
import { PendingApproval } from "@/components/auth/PendingApproval";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const [profile, previewing] = await Promise.all([getProfile(), isPreviewingAsMember()]);

  // Only an explicit `false` blocks access, so the app keeps working until the
  // approval SQL (migration 0012) has been run.
  if (profile?.approved === false) return <PendingApproval name={profile.name} />;

  const resolvedProfile = profile ?? {
    id: userId,
    name: "Member",
    username: null,
    avatar_url: null,
    role: "member" as const,
    approved: true,
    created_at: new Date().toISOString(),
  };

  return (
    <CurrentUserProvider profile={resolvedProfile}>
      <AppShell>
        {previewing && (
          <form
            action={viewAsAdmin}
            className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-plum-bg px-4 py-3 text-[13.5px] font-semibold text-plum-ink"
          >
            <span>You&apos;re viewing CONNECT as a member.</span>
            <button type="submit" className="rounded-lg bg-plum px-3 py-1.5 text-xs font-bold text-white">
              Switch back to admin
            </button>
          </form>
        )}
        {children}
      </AppShell>
    </CurrentUserProvider>
  );
}
