"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ExternalLink, FileText, Lock, PlayCircle } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import { youtubeId } from "@/lib/utils/youtube";
import type { ModuleRow, TopicRow } from "@/lib/queries/training";

type Tab = "video" | "pdf";

export function CourseView({
  courseId,
  modules,
  completed: initialCompleted,
  unlocked,
  canLearn,
  isAdmin,
}: {
  courseId: string;
  modules: ModuleRow[];
  completed: string[];
  unlocked: string[];
  canLearn: boolean;
  isAdmin: boolean;
}) {
  const me = useCurrentUser();
  const toast = useToast();
  const router = useRouter();
  const [completed, setCompleted] = useState(() => new Set(initialCompleted));

  const flat = useMemo(
    () => modules.flatMap((m, mi) => m.topics.map((t) => ({ ...t, moduleTitle: m.title, moduleNo: mi + 1 }))),
    [modules]
  );
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);

  // Same rule as the database: the first lesson, one after a finished lesson, or one an admin opened.
  const isOpen = (i: number) =>
    canLearn && (isAdmin || i === 0 || completed.has(flat[i - 1].id) || unlockedSet.has(flat[i].id));

  const firstTodo = flat.findIndex((t, i) => isOpen(i) && !completed.has(t.id));
  const [selected, setSelected] = useState<string | null>(flat[Math.max(firstTodo, 0)]?.id ?? null);
  const [tab, setTab] = useState<Tab>("video");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const index = Math.max(flat.findIndex((t) => t.id === selected), 0);
  const topic: (TopicRow & { moduleTitle: string; moduleNo: number }) | undefined = flat[index];
  const open = topic ? isOpen(index) : false;
  const videoId = open ? youtubeId(topic?.youtube_url) : null;
  const hasPdf = open && Boolean(topic?.pdf_path);

  // Show whichever material exists when switching lessons.
  useEffect(() => {
    setTab(videoId ? "video" : hasPdf ? "pdf" : "video");
    setPdfUrl(null);
    setPdfError(null);
  }, [topic?.id, videoId, hasPdf]);

  useEffect(() => {
    if (tab !== "pdf" || !hasPdf || !topic?.pdf_path || pdfUrl) return;
    let cancelled = false;
    createClient()
      .storage.from("lessons")
      .createSignedUrl(topic.pdf_path, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) setPdfError("Couldn't open this PDF. Try again in a moment.");
        else setPdfUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, hasPdf, topic?.pdf_path, pdfUrl]);

  const doneCount = flat.filter((t) => completed.has(t.id)).length;
  const pct = flat.length ? Math.round((doneCount / flat.length) * 100) : 0;

  async function toggleDone() {
    if (!topic || !open || saving) return;
    setSaving(true);
    const supabase = createClient();
    const wasDone = completed.has(topic.id);
    const next = new Set(completed);
    if (wasDone) next.delete(topic.id);
    else next.add(topic.id);
    setCompleted(next);

    const { error } = wasDone
      ? await supabase.from("topic_completions").delete().eq("user_id", me.id).eq("topic_id", topic.id)
      : await supabase.from("topic_completions").insert({ user_id: me.id, topic_id: topic.id, course_id: courseId });
    setSaving(false);

    if (error) {
      setCompleted(completed);
      toast(error.message);
      return;
    }
    if (!wasDone) {
      const nextTopic = flat[index + 1];
      toast(nextTopic ? "Lesson complete. Next lesson unlocked." : "Course complete. Well done!");
      if (nextTopic) setSelected(nextTopic.id);
    }
    router.refresh();
  }

  if (flat.length === 0) {
    return (
      <Card>
        <p className="m-0 text-[14px] text-text-soft">Lessons are coming soon.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 desktop:grid-cols-[300px_minmax(0,1fr)] tablet:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="h-fit p-3.5!">
        <div className="mb-3 px-1">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-bold">{doneCount} / {flat.length} lessons complete</span>
            <span className="font-extrabold text-amber-ink">{pct}%</span>
          </div>
          <ProgressBar percent={pct} />
        </div>
        <div className="flex flex-col gap-3">
          {modules.map((m, mi) => (
            <div key={m.id}>
              <div className="px-1 pb-1 text-[11px] font-extrabold tracking-wide text-text-soft uppercase">
                Module {mi + 1} — {m.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {m.topics.map((t) => {
                  const i = flat.findIndex((f) => f.id === t.id);
                  const unlockedNow = isOpen(i);
                  const done = completed.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelected(t.id)}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] transition",
                        t.id === topic?.id ? "bg-amber font-bold text-[#3B2504]" : "hover:bg-page",
                        !unlockedNow && t.id !== topic?.id && "text-text-soft"
                      )}
                    >
                      <span
                        className={clsx(
                          "flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px]",
                          done ? "bg-moss text-white" : t.id === topic?.id ? "bg-[#3B2504]/15" : "bg-line"
                        )}
                      >
                        {done ? <Check className="h-3 w-3" /> : unlockedNow ? i + 1 : <Lock className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">{t.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="min-w-0">
        {topic && (
          <Card>
            <div className="text-[11px] font-extrabold tracking-wide text-text-soft uppercase">
              Module {topic.moduleNo} · {topic.moduleTitle}
            </div>
            <h2 className="font-display m-0 mt-1 text-[22px] leading-tight font-bold">{topic.title}</h2>

            {!open ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-page p-4">
                <Lock className="mt-0.5 h-5 w-5 flex-none text-text-soft" />
                <div className="text-[14px]">
                  <div className="font-bold">This lesson is locked</div>
                  <div className="text-text-soft">
                    {canLearn
                      ? "Finish the lesson before it to open this one, or ask an admin to unlock it."
                      : "Enroll in this training to start learning."}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {(videoId || hasPdf) && (
                  <div className="mt-4 inline-flex gap-1 rounded-xl bg-page p-1">
                    {videoId && (
                      <TabButton active={tab === "video"} onClick={() => setTab("video")}>
                        <PlayCircle className="h-4 w-4" /> Video
                      </TabButton>
                    )}
                    {hasPdf && (
                      <TabButton active={tab === "pdf"} onClick={() => setTab("pdf")}>
                        <FileText className="h-4 w-4" /> Lesson PDF
                      </TabButton>
                    )}
                  </div>
                )}

                <div className="mt-3">
                  {tab === "video" && videoId ? (
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                        title={topic.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  ) : tab === "pdf" && hasPdf ? (
                    pdfError ? (
                      <p className="m-0 rounded-xl bg-coral-bg px-4 py-3 text-[13.5px] text-coral-ink">{pdfError}</p>
                    ) : pdfUrl ? (
                      <>
                        <iframe src={pdfUrl} title={topic.pdf_name ?? "Lesson PDF"} className="h-[70vh] w-full rounded-xl border border-line bg-white" />
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent-to"
                        >
                          Open full screen <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </>
                    ) : (
                      <p className="m-0 text-[13.5px] text-text-soft">Opening lesson…</p>
                    )
                  ) : (
                    <p className="m-0 rounded-xl bg-page px-4 py-3 text-[13.5px] text-text-soft">
                      No video or PDF has been added to this lesson yet.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => flat[index - 1] && setSelected(flat[index - 1].id)}
                    disabled={index === 0}
                    className="rounded-[10px] border border-line px-4 py-2 text-sm font-bold hover:bg-page disabled:opacity-40"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={toggleDone}
                    disabled={saving}
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-sm font-bold transition",
                      completed.has(topic.id) ? "border border-line text-text-soft hover:bg-page" : "bg-moss text-white hover:brightness-105"
                    )}
                  >
                    {completed.has(topic.id) ? (
                      "Completed · Undo"
                    ) : (
                      <>
                        Mark as done <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-1.5 text-[13.5px] font-bold transition",
        active ? "bg-ink text-white" : "text-text-soft hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
