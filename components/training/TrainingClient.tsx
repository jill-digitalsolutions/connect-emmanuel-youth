import Link from "next/link";
import { BookOpen, Check, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "@/components/ui/SectionHead";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FieldLabel, TextInput, Select } from "@/components/ui/FormField";
import { Avatar } from "@/components/ui/Avatar";
import { TRACK_ICONS } from "@/lib/utils/constants";
import type { CourseTrack } from "@/lib/types/database.types";
import type { Catalog } from "@/lib/queries/training";
import { addCourse, cancelEnrollment, decideEnrollment, requestEnrollment } from "@/app/(app)/training/actions";

const TRACKS: CourseTrack[] = ["Leadership", "Bible Study", "Media Team", "Worship"];

export function TrainingClient({
  catalog,
  notice,
  error,
  isAdmin,
}: {
  catalog: Catalog;
  notice?: string;
  error?: string;
  isAdmin: boolean;
}) {
  const { cards, requests } = catalog;

  return (
    <div>
      {notice && <p className="mb-4 rounded-xl bg-moss-bg px-4 py-3 text-[13.5px] font-semibold text-moss-ink">{notice}</p>}
      {error && <p className="mb-4 rounded-xl bg-coral-bg px-4 py-3 text-[13.5px] font-semibold text-coral-ink">{error}</p>}

      {isAdmin && (
        <Link
          href="/training/progress"
          className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-[14px] font-bold text-text no-underline hover:bg-page"
        >
          Enrollment and progress overview
          <span className="text-accent-to">View →</span>
        </Link>
      )}

      {isAdmin && requests.length > 0 && (
        <Card className="mb-4 border-amber">
          <h3 className="m-0 mb-1 text-[17px] font-semibold">Enrollment requests ({requests.length})</h3>
          <p className="m-0 mb-3 text-[13px] text-text-soft">Approve to let them start the lessons.</p>
          <div className="divide-y divide-line">
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar name={r.user.name} avatarUrl={r.user.avatar_url} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold">{r.user.name}</div>
                  <div className="truncate text-xs text-text-soft">
                    {r.user.username ? `@${r.user.username} · ` : ""}wants to join {r.course_title}
                  </div>
                </div>
                <form action={decideEnrollment} className="flex gap-1.5">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="returnTo" value="/training" />
                  <button name="decision" value="approve" className="rounded-lg bg-moss px-3 py-1.5 text-xs font-bold text-white">
                    Approve
                  </button>
                  <button name="decision" value="decline" className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-page">
                    Decline
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <form action={addCourse}>
            <FieldLabel>New training</FieldLabel>
            <TextInput name="title" required maxLength={120} placeholder="e.g. DLT 1 — Discipleship Leadership Training" />
            <FieldLabel>Track</FieldLabel>
            <Select name="track">
              {TRACKS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
            <p className="mt-2 mb-0 text-xs text-text-soft">You add the modules, topics, videos and PDFs on the next screen.</p>
            <button type="submit" className="mt-3 rounded-[10px] bg-amber px-4 py-2.5 text-sm font-bold text-[#3B2504]">
              Create training
            </button>
          </form>
        </Card>
      )}

      {TRACKS.map((track) => {
        const list = cards.filter((c) => c.course.track === track);
        return (
          <div key={track}>
            <SectionHead title={track} />
            {list.length === 0 ? (
              <Card>
                <EmptyState>No trainings in this track yet.</EmptyState>
              </Card>
            ) : (
              <div className="grid gap-3 tablet:grid-cols-2">
                {list.map(({ course, modules, topics, status, done }) => {
                  const pct = topics ? Math.round((done / topics) * 100) : 0;
                  const complete = topics > 0 && done >= topics;
                  return (
                    <Card key={course.id} className="flex flex-col">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10.5 w-10.5 flex-none items-center justify-center rounded-[10px] bg-amber-bg text-lg">
                          {TRACK_ICONS[course.track]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/training/${course.id}`} className="text-[15px] font-bold text-text no-underline hover:underline">
                            {course.title}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-soft">
                            <BookOpen className="h-3.5 w-3.5" />
                            {modules} {modules === 1 ? "module" : "modules"} · {topics} {topics === 1 ? "topic" : "topics"}
                          </div>
                        </div>
                        {complete && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-moss-bg px-2 py-0.5 text-[10px] font-extrabold text-moss-ink">
                            <Check className="h-3 w-3" /> Completed
                          </span>
                        )}
                      </div>

                      {status === "approved" ? (
                        <>
                          <ProgressBar percent={pct} />
                          <div className="mt-1.5 flex items-center justify-between text-xs text-text-soft">
                            <span>
                              {done} of {topics} topics
                            </span>
                            <span className="font-extrabold text-amber-ink">{pct}%</span>
                          </div>
                          <Link
                            href={`/training/${course.id}`}
                            className="mt-3 rounded-[10px] bg-amber py-2 text-center text-sm font-bold text-[#3B2504] no-underline"
                          >
                            {complete ? "Review lessons" : done > 0 ? "Continue" : "Start learning"}
                          </Link>
                        </>
                      ) : status === "pending" ? (
                        <form action={cancelEnrollment} className="mt-3 flex items-center gap-2">
                          <input type="hidden" name="courseId" value={course.id} />
                          <input type="hidden" name="returnTo" value="/training" />
                          <span className="inline-flex flex-1 items-center gap-1.5 rounded-[10px] bg-amber-bg px-3 py-2 text-[13px] font-bold text-amber-ink">
                            <Clock className="h-4 w-4" /> Waiting for admin approval
                          </span>
                          <button className="rounded-[10px] border border-line px-3 py-2 text-xs font-bold hover:bg-page">Cancel</button>
                        </form>
                      ) : (
                        <form action={requestEnrollment} className="mt-3">
                          <input type="hidden" name="courseId" value={course.id} />
                          <input type="hidden" name="returnTo" value="/training" />
                          {status === "declined" && (
                            <p className="mt-0 mb-2 text-xs text-coral-ink">Your last request wasn&apos;t approved. You can ask again.</p>
                          )}
                          <button
                            type="submit"
                            disabled={topics === 0 && !isAdmin}
                            className="w-full rounded-[10px] bg-amber py-2 text-sm font-bold text-[#3B2504] disabled:opacity-50"
                          >
                            {topics === 0 ? "Coming soon" : "Enroll"}
                          </button>
                        </form>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
