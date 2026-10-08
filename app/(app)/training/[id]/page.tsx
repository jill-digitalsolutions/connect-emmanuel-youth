import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { getCourseDetail } from "@/lib/queries/training";
import { getProfile, getUserId } from "@/lib/supabase/session";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHead } from "@/components/ui/SectionHead";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FieldLabel, TextInput } from "@/components/ui/FormField";
import { CourseView } from "@/components/training/CourseView";
import { TopicMediaEditor } from "@/components/training/TopicMediaEditor";
import {
  addModule, addTopic, cancelEnrollment, decideEnrollment, deleteCourse, deleteModule, deleteTopic,
  renameCourse, renameModule, renameTopic, requestEnrollment, unlockNext,
} from "../actions";

const input = "min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13.5px] text-text";
const small = "rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-page";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string; edit?: string }>;
}) {
  const [{ id }, { notice, error, edit }, userId, me] = await Promise.all([params, searchParams, getUserId(), getProfile()]);
  if (!userId || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const isAdmin = me?.role === "admin";
  const detail = await getCourseDetail(id, userId, isAdmin);
  if (!detail) notFound();

  const { course, modules, totalTopics, status, completed, unlocked, roster } = detail;
  const canLearn = isAdmin || status === "approved";
  const editing = isAdmin && edit === "1";
  const here = `/training/${course.id}`;
  const approvedRoster = roster.filter((r) => r.status === "approved");
  const pending = roster.filter((r) => r.status === "pending");

  return (
    <div>
      <Link href="/training" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent-to">
        <ArrowLeft className="h-4 w-4" /> All trainings
      </Link>

      {notice && <p className="mb-4 rounded-xl bg-moss-bg px-4 py-3 text-[13.5px] font-semibold text-moss-ink">{notice}</p>}
      {error && <p className="mb-4 rounded-xl bg-coral-bg px-4 py-3 text-[13.5px] font-semibold text-coral-ink">{error}</p>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display m-0 text-[24px] font-bold">{course.title}</h2>
            <div className="mt-0.5 text-[13px] text-text-soft">
              {course.track} · {modules.length} {modules.length === 1 ? "module" : "modules"} · {totalTopics} topics
            </div>
          </div>
          {isAdmin && (
            <Link
              href={editing ? here : `${here}?edit=1`}
              className={`rounded-[10px] px-4 py-2 text-sm font-bold no-underline ${editing ? "bg-moss text-white" : "border border-line text-text hover:bg-page"}`}
            >
              {editing ? "Done" : "Edit training"}
            </Link>
          )}
        </div>

        {!isAdmin && status !== "approved" && (
          <div className="mt-4">
            {status === "pending" ? (
              <form action={cancelEnrollment} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="returnTo" value={here} />
                <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-amber-bg px-3 py-2 text-[13px] font-bold text-amber-ink">
                  <Clock className="h-4 w-4" /> Waiting for admin approval
                </span>
                <button className={small}>Cancel request</button>
              </form>
            ) : (
              <form action={requestEnrollment}>
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="returnTo" value={here} />
                {status === "declined" && <p className="mt-0 mb-2 text-xs text-coral-ink">Your last request wasn&apos;t approved. You can ask again.</p>}
                <button className="rounded-[10px] bg-amber px-5 py-2.5 text-sm font-bold text-[#3B2504]">Enroll in this training</button>
              </form>
            )}
          </div>
        )}
      </Card>

      {editing ? (
        <div className="grid gap-4">
          <Card>
            <h3 className="m-0 mb-3 text-[16px] font-semibold">Training details</h3>
            <form action={renameCourse} className="flex gap-2">
              <input type="hidden" name="courseId" value={course.id} />
              <input name="title" defaultValue={course.title} maxLength={120} className={input} />
              <button className={small}>Rename</button>
            </form>
            <form action={deleteCourse} className="mt-3">
              <input type="hidden" name="courseId" value={course.id} />
              <button className="text-xs font-bold text-coral hover:underline">Delete this whole training</button>
            </form>
          </Card>

          {modules.map((m, mi) => (
            <Card key={m.id}>
              <div className="mb-3 text-[11px] font-extrabold tracking-wide text-text-soft uppercase">Module {mi + 1}</div>
              <form action={renameModule} className="flex gap-2">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="id" value={m.id} />
                <input name="title" defaultValue={m.title} maxLength={120} className={input} />
                <button className={small}>Rename</button>
              </form>

              <div className="mt-3 divide-y divide-line">
                {m.topics.map((t, ti) => (
                  <div key={t.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 flex-none text-center text-xs font-bold text-text-soft">{ti + 1}</span>
                      <form action={renameTopic} className="flex flex-1 gap-2">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="id" value={t.id} />
                        <input name="title" defaultValue={t.title} maxLength={120} className={input} />
                        <button className={small}>Rename</button>
                      </form>
                      <form action={deleteTopic}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="id" value={t.id} />
                        <button className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-coral hover:bg-coral-bg">Remove</button>
                      </form>
                    </div>
                    <TopicMediaEditor courseId={course.id} topicId={t.id} youtubeUrl={t.youtube_url} pdfName={t.pdf_name} pdfPath={t.pdf_path} />
                  </div>
                ))}
              </div>

              <form action={addTopic} className="mt-2 flex gap-2">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="moduleId" value={m.id} />
                <input name="title" required maxLength={120} placeholder="Add a topic to this module" className={input} />
                <button className="rounded-lg bg-amber px-3 py-1.5 text-xs font-bold text-[#3B2504]">Add topic</button>
              </form>

              <form action={deleteModule} className="mt-3">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="id" value={m.id} />
                <button className="text-xs font-bold text-coral hover:underline">Remove this module and its topics</button>
              </form>
            </Card>
          ))}

          <Card>
            <form action={addModule}>
              <input type="hidden" name="courseId" value={course.id} />
              <FieldLabel>Add a module</FieldLabel>
              <TextInput name="title" required maxLength={120} placeholder="e.g. Module 4 — Serving in ministry" />
              <button className="mt-3 rounded-[10px] bg-ink px-4 py-2 text-sm font-bold text-white">Add module</button>
            </form>
          </Card>
        </div>
      ) : (
        <CourseView courseId={course.id} modules={modules} completed={completed} unlocked={unlocked} canLearn={canLearn} isAdmin={isAdmin} />
      )}

      {isAdmin && !editing && (
        <>
          {pending.length > 0 && (
            <>
              <SectionHead title={`Enrollment requests (${pending.length})`} />
              <Card>
                <div className="divide-y divide-line">
                  {pending.map((r) => (
                    <div key={r.enrollmentId} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar name={r.user.name} avatarUrl={r.user.avatar_url} size={36} />
                      <div className="min-w-0 flex-1 text-[14px] font-bold">{r.user.name}</div>
                      <form action={decideEnrollment} className="flex gap-1.5">
                        <input type="hidden" name="id" value={r.enrollmentId} />
                        <input type="hidden" name="returnTo" value={here} />
                        <button name="decision" value="approve" className="rounded-lg bg-moss px-3 py-1.5 text-xs font-bold text-white">Approve</button>
                        <button name="decision" value="decline" className={small}>Decline</button>
                      </form>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          <SectionHead title={`Enrolled members (${approvedRoster.length})`} />
          <Card>
            {approvedRoster.length === 0 ? (
              <p className="m-0 text-[13.5px] text-text-soft">Nobody is enrolled yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {approvedRoster.map((r) => {
                  const pct = totalTopics ? Math.round((r.done / totalTopics) * 100) : 0;
                  return (
                    <div key={r.enrollmentId} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.user.name} avatarUrl={r.user.avatar_url} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold">{r.user.name}</div>
                          <div className="text-xs text-text-soft">
                            {r.done} of {totalTopics} topics · <span className="font-extrabold text-amber-ink">{pct}%</span>
                          </div>
                        </div>
                        <form action={unlockNext}>
                          <input type="hidden" name="courseId" value={course.id} />
                          <input type="hidden" name="userId" value={r.user.id} />
                          <button className={small} title="Open their next lesson without waiting for them to finish the current one">
                            Unlock next
                          </button>
                        </form>
                      </div>
                      <ProgressBar percent={pct} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
