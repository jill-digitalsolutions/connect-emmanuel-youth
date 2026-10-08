import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { getMemberDetail } from "@/lib/queries/member";
import { getProfile } from "@/lib/supabase/session";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHead } from "@/components/ui/SectionHead";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FieldLabel, TextInput, TextArea } from "@/components/ui/FormField";
import { assignMinistry, removeMinistry, saveAddress } from "./actions";

const ROLE_SUGGESTIONS = ["Member", "Leader", "Co-leader", "Coordinator", "Volunteer", "Team Lead"];

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string; edit?: string }>;
}) {
  const [{ id }, { notice, error, edit }, viewer] = await Promise.all([params, searchParams, getProfile()]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await getMemberDetail(id);
  if (!detail || detail.profile.approved === false) notFound();

  const { profile, address, ministries, trainings, allMinistries } = detail;
  const isAdmin = viewer?.role === "admin";
  const isMe = viewer?.id === profile.id;
  const canSeeAddress = isMe || isAdmin;
  // Admins can edit anyone; a member can edit only their own address.
  const canEdit = isAdmin || isMe;
  const editing = canEdit && edit === "1";

  // Other people see a clean read-only profile: only sections that have content.
  const showEmpty = canEdit;

  const inProgress = trainings.filter((t) => t.modules_done < t.total_modules);
  const completed = trainings.filter((t) => t.modules_done >= t.total_modules);

  return (
    <div>
      <Link href="/members" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent-to">
        <ArrowLeft className="h-4 w-4" /> All members
      </Link>

      {notice && <p className="mb-4 rounded-xl bg-moss-bg px-4 py-3 text-[13.5px] font-semibold text-moss-ink">{notice}</p>}
      {error && <p className="mb-4 rounded-xl bg-coral-bg px-4 py-3 text-[13.5px] font-semibold text-coral-ink">{error}</p>}

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} avatarUrl={profile.avatar_url} size={84} />
          <div className="min-w-0">
            <h2 className="font-display m-0 truncate text-[24px] font-bold">{profile.name}</h2>
            <div className="text-[14px] text-text-soft">{profile.username ? `@${profile.username}` : "no username"}</div>
            {profile.role === "admin" && (
              <span className="mt-1.5 inline-block rounded-full bg-plum-bg px-2 py-0.5 text-[10px] font-extrabold text-plum-ink">
                Admin
              </span>
            )}
          </div>
          {canEdit && (
            <Link
              href={editing ? `/members/${profile.id}` : `/members/${profile.id}?edit=1`}
              className={`ml-auto flex-none rounded-[10px] px-4 py-2 text-sm font-bold no-underline ${
                editing ? "bg-moss text-white" : "border border-line text-text hover:bg-page"
              }`}
            >
              {editing ? "Done" : "Edit"}
            </Link>
          )}
        </div>
      </Card>

      {canSeeAddress && (
        <>
          <SectionHead title="Address" />
          <Card>
            {editing ? (
              <form action={saveAddress}>
                <input type="hidden" name="userId" value={profile.id} />
                <FieldLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Where they live
                  </span>
                </FieldLabel>
                <TextArea name="address" defaultValue={address ?? ""} maxLength={300} placeholder="Street, barangay, city" />
                <p className="mt-1 mb-0 text-xs text-text-soft">
                  Only {isMe ? "you and admins" : "admins and this member"} can see this.
                </p>
                <button
                  type="submit"
                  className="mt-3 rounded-[10px] bg-gradient-to-r from-accent-from to-accent-to px-4 py-2 text-sm font-bold text-white"
                >
                  Save address
                </button>
              </form>
            ) : (
              <div className="flex items-start gap-2 text-[14px]">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-text-soft" />
                <span className={address ? "" : "text-text-soft"}>{address || "No address added"}</span>
              </div>
            )}
          </Card>
        </>
      )}

      {(ministries.length > 0 || showEmpty) && <SectionHead title="Ministries & roles" />}
      {ministries.length === 0 ? (
        !showEmpty ? null :
        <Card>
          <EmptyState>Not in any ministry yet.</EmptyState>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-line">
            {ministries.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold">{m.name}</div>
                  <div className="text-[13px] text-text-soft">{m.role}</div>
                </div>
                {isAdmin && editing && (
                  <form action={removeMinistry}>
                    <input type="hidden" name="userId" value={profile.id} />
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-page">
                      Remove
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {isAdmin && editing && (
        <Card className="mt-3">
          <h4 className="m-0 mb-1 text-[15px] font-semibold">Add or change a ministry role</h4>
          <form action={assignMinistry}>
            <input type="hidden" name="userId" value={profile.id} />
            <FieldLabel>Ministry</FieldLabel>
            <TextInput name="ministry" required list="ministry-list" maxLength={60} placeholder="Pick one or type a new ministry" />
            <datalist id="ministry-list">
              {allMinistries.map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
            <FieldLabel>Role in this ministry</FieldLabel>
            <TextInput name="role" list="role-list" maxLength={60} placeholder="e.g. Leader" />
            <datalist id="role-list">
              {ROLE_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <button type="submit" className="mt-3.5 rounded-[10px] bg-plum px-4 py-2 text-sm font-bold text-white">
              Save role
            </button>
          </form>
        </Card>
      )}

      {(inProgress.length > 0 || showEmpty) && <SectionHead title="Currently in training" />}
      {inProgress.length === 0 ? (
        !showEmpty ? null :
        <Card>
          <EmptyState>Not currently in any training.</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-3 tablet:grid-cols-2">
          {inProgress.map((t) => (
            <Card key={t.id}>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[14.5px] font-bold">{t.title}</div>
                <div className="text-[13px] font-extrabold text-amber-ink">
                  {Math.round((t.modules_done / t.total_modules) * 100)}%
                </div>
              </div>
              <div className="text-xs text-text-soft">
                {t.track} · {t.modules_done} of {t.total_modules} modules
              </div>
              <ProgressBar percent={(t.modules_done / t.total_modules) * 100} />
            </Card>
          ))}
        </div>
      )}

      {!showEmpty && ministries.length === 0 && trainings.length === 0 && (
        <Card className="mt-3">
          <EmptyState>No ministry or training details added yet.</EmptyState>
        </Card>
      )}

      {completed.length > 0 && (
        <>
          <SectionHead title="Completed trainings" />
          <Card>
            <ul className="m-0 list-none divide-y divide-line p-0">
              {completed.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-[14px] font-semibold">{t.title}</span>
                  <span className="text-xs text-text-soft">{t.track}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
