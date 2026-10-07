import { redirect } from "next/navigation";
import { getRealProfile } from "@/lib/supabase/session";
import { getAllProfiles } from "@/lib/queries/profiles";
import { Card } from "@/components/ui/Card";
import { SectionHead } from "@/components/ui/SectionHead";
import { FieldLabel, TextInput } from "@/components/ui/FormField";
import { Avatar } from "@/components/ui/Avatar";
import { createAccount, setRole, viewAsMember } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const me = await getRealProfile();
  if (!me || me.role !== "admin") redirect("/home");

  const { notice, error } = await searchParams;
  const members = (await getAllProfiles()).sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div>
      {notice && (
        <p className="mb-4 rounded-xl bg-moss-bg px-4 py-3 text-[13.5px] font-semibold text-moss-ink">{notice}</p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-coral-bg px-4 py-3 text-[13.5px] font-semibold text-coral-ink">{error}</p>
      )}

      <Card className="mb-4">
        <h3 className="m-0 mb-1 text-[17px] font-semibold">Your view</h3>
        <p className="m-0 text-[13px] text-text-soft">
          You are an admin. Switch to see CONNECT exactly as a regular member does, and switch back any time.
        </p>
        <form action={viewAsMember}>
          <button
            type="submit"
            className="mt-3.5 rounded-[10px] border border-line px-4 py-2.5 text-sm font-bold hover:bg-page"
          >
            View as member
          </button>
        </form>
      </Card>

      <Card>
        <h3 className="m-0 mb-1 text-[17px] font-semibold">Create an account</h3>
        <p className="m-0 text-[13px] text-text-soft">
          Give the person their username and password. They can log in right away.
        </p>
        <form action={createAccount}>
          <FieldLabel>Full name</FieldLabel>
          <TextInput name="name" required placeholder="e.g. Maria Santos" />
          <FieldLabel>Username</FieldLabel>
          <TextInput
            name="username"
            required
            minLength={3}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="e.g. mariasantos"
          />
          <FieldLabel>Email</FieldLabel>
          <TextInput name="email" type="email" required autoCapitalize="none" placeholder="name@example.com" />
          <FieldLabel>Password</FieldLabel>
          <TextInput name="password" type="text" required minLength={6} autoComplete="off" placeholder="At least 6 characters" />
          <label className="mt-3.5 flex items-center gap-2 text-[13.5px] font-semibold">
            <input type="checkbox" name="admin" className="h-4 w-4" /> Make this person an admin
          </label>
          <button
            type="submit"
            className="mt-4 rounded-[10px] bg-gradient-to-r from-accent-from to-accent-to px-4 py-2.5 text-sm font-bold text-white"
          >
            Create account
          </button>
        </form>
      </Card>

      <SectionHead title={`Members (${members.length})`} />
      <Card>
        <div className="divide-y divide-line">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar name={m.name} avatarUrl={m.avatar_url} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{m.name}</div>
                <div className="text-xs text-text-soft">
                  {m.username ? `@${m.username}` : "no username"} · {m.role}
                </div>
              </div>
              {m.id !== me.id && (
                <form action={setRole}>
                  <input type="hidden" name="userId" value={m.id} />
                  <input type="hidden" name="role" value={m.role === "admin" ? "member" : "admin"} />
                  <button
                    type="submit"
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-page"
                  >
                    {m.role === "admin" ? "Remove admin" : "Make admin"}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
