"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "@/components/ui/SectionHead";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FormRow, Select } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { TRACK_ICONS } from "@/lib/utils/constants";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import type { Course, CourseTrack } from "@/lib/types/database.types";
import type { CourseWithProgress } from "@/lib/queries/training";

const TRACKS: CourseTrack[] = ["Leadership", "Bible Study", "Media Team", "Worship"];

export function TrainingClient({ initialCourses }: { initialCourses: CourseWithProgress[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [title, setTitle] = useState("");
  const [track, setTrack] = useState<CourseTrack>("Leadership");
  const [modules, setModules] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const me = useCurrentUser();
  const isAdmin = me.role === "admin";

  useRealtimeTable<Course>("courses", (payload) => {
    setCourses((prev) => {
      const merged = mergeChange(prev as unknown as Course[], payload);
      return merged.map((c) => {
        const existing = prev.find((p) => p.id === c.id);
        return { ...c, modules_done: existing?.modules_done ?? 0 };
      });
    });
  });

  useRealtimeTable<{ course_id: string; modules_done: number; user_id: string }>(
    "course_progress",
    (payload) => {
      const row = (payload.new ?? payload.old) as { course_id: string; modules_done: number; user_id: string };
      if (!row || row.user_id !== me.id) return;
      setCourses((prev) =>
        prev.map((c) => (c.id === row.course_id ? { ...c, modules_done: row.modules_done } : c))
      );
    },
    `user_id=eq.${me.id}`
  );

  async function incrementProgress(course: CourseWithProgress) {
    if (course.modules_done >= course.total_modules) return;
    const nextDone = course.modules_done + 1;
    setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, modules_done: nextDone } : c)));

    const supabase = createClient();
    const { error } = await supabase
      .from("course_progress")
      .upsert(
        { course_id: course.id, user_id: me.id, modules_done: nextDone },
        { onConflict: "course_id,user_id" }
      );
    if (error) {
      toast(error.message);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? course : c)));
    } else {
      toast("Progress saved");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const total = parseInt(modules, 10);
    if (!title.trim()) {
      toast("Add a course title");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("courses").insert({
      title: title.trim(),
      track,
      total_modules: total > 0 ? total : 1,
    });
    setSubmitting(false);
    if (error) {
      toast(error.message);
      return;
    }
    setTitle("");
    setModules("");
    toast("Training added");
  }

  const grouped = useMemo(() => {
    const map = new Map<CourseTrack, CourseWithProgress[]>();
    for (const t of TRACKS) map.set(t, []);
    for (const c of courses) map.get(c.track)?.push(c);
    return map;
  }, [courses]);

  return (
    <div>
      {isAdmin && (
        <Card>
          <form onSubmit={handleSubmit}>
            <FieldLabel>Course / webinar title</FieldLabel>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Small Group Facilitation 101"
            />
            <FormRow>
              <div>
                <FieldLabel>Track</FieldLabel>
                <Select value={track} onChange={(e) => setTrack(e.target.value as CourseTrack)}>
                  {TRACKS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Total modules</FieldLabel>
                <TextInput
                  value={modules}
                  onChange={(e) => setModules(e.target.value)}
                  placeholder="e.g. 6"
                  inputMode="numeric"
                />
              </div>
            </FormRow>
            <div className="mt-3.5">
              <Button type="submit" variant="amber" disabled={submitting}>
                {submitting ? "Adding…" : "Add training"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {TRACKS.map((t) => {
        const list = grouped.get(t) ?? [];
        return (
          <div key={t}>
            <SectionHead title={t} />
            <Card>
              {list.length === 0 ? (
                <EmptyState>No trainings in this track yet.</EmptyState>
              ) : (
                <div className="divide-y divide-line">
                  {list.map((c) => {
                    const pct = c.total_modules ? Math.round((c.modules_done / c.total_modules) * 100) : 0;
                    const complete = c.modules_done >= c.total_modules;
                    return (
                      <div key={c.id} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                        <div className="flex h-10.5 w-10.5 flex-none items-center justify-center rounded-[10px] bg-amber-bg text-lg">
                          {TRACK_ICONS[c.track]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="m-0 mb-0.5 text-[14.5px] font-bold">{c.title}</h4>
                          <div className="text-xs text-text-soft">
                            {c.track} · {c.modules_done}/{c.total_modules} modules
                            {complete ? " · Complete" : ""}
                          </div>
                          <ProgressBar percent={pct} />
                        </div>
                        <Button
                          size="sm"
                          variant={complete ? "ghost" : "amber"}
                          disabled={complete}
                          onClick={() => incrementProgress(c)}
                        >
                          {complete ? "Done" : "+1 module"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
