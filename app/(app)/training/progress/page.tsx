import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { getProfile } from "@/lib/supabase/session";
import { getProgressOverview } from "@/lib/queries/progress";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { timeAgo } from "@/lib/utils/dates";

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const me = await getProfile();
  if (!me || me.role !== "admin") redirect("/training");
  const [{ course }, courses] = await Promise.all([searchParams, getProgressOverview()]);

  const selected = courses.find((c) => c.id === course) ?? courses[0];
  const enrolled = selected?.rows.filter((r) => r.status === "approved") ?? [];
  const pending = selected?.rows.filter((r) => r.status === "pending") ?? [];
  const total = selected?.total ?? 0;
  const completed = enrolled.filter((r) => total > 0 && r.done >= total).length;
  const avg = enrolled.length && total ? Math.round((enrolled.reduce((s, r) => s + r.done / total, 0) / enrolled.length) * 100) : 0;

  return (
    <div>
      <Link href="/training" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent-to">
        <ArrowLeft className="h-4 w-4" /> All trainings
      </Link>

      {courses.length === 0 ? (
        <Card>
          <EmptyState>No trainings yet.</EmptyState>
        </Card>
      ) : (
        <>
          <h3 className="m-0 mb-2.5 text-[17px] font-semibold">All trainings at a glance</h3>
          <div className="mb-5 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
            {courses.map((c) => {
              const appr = c.rows.filter((r) => r.status === "approved");
              const wait = c.rows.filter((r) => r.status === "pending").length;
              const fin = appr.filter((r) => c.total > 0 && r.done >= c.total).length;
              const average = appr.length && c.total ? Math.round((appr.reduce((sum, r) => sum + r.done / c.total, 0) / appr.length) * 100) : 0;
              const active = c.id === selected.id;
              return (
                <Link
                  key={c.id}
                  href={`/training/progress?course=${c.id}`}
                  className={clsx(
                    "block rounded-xl border bg-surface p-3.5 no-underline transition hover:shadow-md",
                    active ? "border-amber shadow-[inset_0_0_0_1px_var(--color-amber)]" : "border-line"
                  )}
                >
                  <div className="truncate text-[14.5px] font-bold text-text">{c.title.split(" — ")[0]}</div>
                  <div className="text-xs text-text-soft">{c.total} topics</div>
                  <div className="mt-2 flex items-baseline justify-between text-xs text-text-soft">
                    <span>
                      <b className="text-text">{appr.length}</b> enrolled · <b className="text-text">{fin}</b> done
                      {wait > 0 && <> · <b className="text-amber-ink">{wait}</b> waiting</>}
                    </span>
                    <span className="font-extrabold text-amber-ink">{average}%</span>
                  </div>
                  <ProgressBar percent={average} />
                </Link>
              );
            })}
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              ["Enrolled", enrolled.length],
              ["Completed", completed],
              ["Average progress", `${avg}%`],
            ].map(([label, value]) => (
              <Card key={label as string} className="p-3.5!">
                <div className="text-xs text-text-soft">{label}</div>
                <div className="font-display text-[24px] font-bold">{value}</div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="m-0 text-[17px] font-semibold">{selected.title}</h3>
              <Link href={`/training/${selected.id}`} className="text-xs font-bold text-accent-to">
                Open training
              </Link>
            </div>

            {enrolled.length === 0 ? (
              <EmptyState>Nobody is enrolled in this training yet.</EmptyState>
            ) : (
              <div className="divide-y divide-line">
                {enrolled.map((r) => {
                  const pct = total ? Math.round((r.done / total) * 100) : 0;
                  const finished = total > 0 && r.done >= total;
                  return (
                    <Link key={r.userId} href={`/members/${r.userId}`} className="block py-3 no-underline first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} avatarUrl={r.avatar_url} size={38} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-text">{r.name}</div>
                          <div className="truncate text-xs text-text-soft">
                            {r.username ? `@${r.username} · ` : ""}
                            {r.lastAt ? `active ${timeAgo(r.lastAt)}` : "not started"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[15px] font-extrabold text-amber-ink">{pct}%</div>
                          <div className="text-xs text-text-soft">
                            {finished ? "Completed" : `${r.done} of ${total}`}
                          </div>
                        </div>
                      </div>
                      <ProgressBar percent={pct} />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {pending.length > 0 && (
            <p className="mt-3 text-[13px] text-text-soft">
              {pending.length} {pending.length === 1 ? "request is" : "requests are"} waiting for approval on the{" "}
              <Link href="/training" className="font-bold text-accent-to">
                Training tab
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
