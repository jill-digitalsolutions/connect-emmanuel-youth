"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "@/components/ui/SectionHead";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FormRow } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { dayAndMonth, todayIso } from "@/lib/utils/dates";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import type { FellowshipSession } from "@/lib/types/database.types";

export function FellowshipClient({ initialSessions }: { initialSessions: FellowshipSession[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const me = useCurrentUser();
  const isAdmin = me.role === "admin";

  useRealtimeTable<FellowshipSession>("sessions", (payload) => {
    setSessions((prev) => mergeChange(prev, payload));
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    // The time field is left uncontrolled: browsers report a half-typed time as
    // "" and a controlled input would wipe it, flashing "Invalid value".
    const time = String(new FormData(form).get("time") ?? "");
    if (!title.trim() || !date) {
      toast("Add a title and date");
      return;
    }
    const rawLink = link.trim();
    if (rawLink && !/^https?:\/\//i.test(rawLink)) {
      toast("The video link must start with http:// or https://");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("sessions").insert({
      title: title.trim(),
      date,
      time: time || null,
      video_link: link.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast(error.message);
      return;
    }
    setTitle("");
    setDate("");
    form.reset();
    setLink("");
    toast("Fellowship scheduled");
  }

  const { upcoming, past } = useMemo(() => {
    const today = todayIso();
    return {
      upcoming: sessions.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
      past: sessions.filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [sessions]);

  return (
    <div>
      {isAdmin && (
        <Card>
          <form onSubmit={handleSubmit}>
            <FieldLabel>Session title</FieldLabel>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Online Fellowship: Faith & Friendship"
            />
            <FormRow>
              <div>
                <FieldLabel>Date</FieldLabel>
                <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Time</FieldLabel>
                <TextInput type="time" name="time" />
              </div>
            </FormRow>
            <FieldLabel>Video link (Zoom, Meet, etc.)</FieldLabel>
            <TextInput
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
            />
            <div className="mt-3.5">
              <Button type="submit" variant="coral" disabled={submitting}>
                {submitting ? "Scheduling…" : "Schedule fellowship"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <SectionHead title="Upcoming" />
      <Card>
        {upcoming.length === 0 ? (
          <EmptyState>No upcoming sessions scheduled.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {upcoming.map((s) => {
              const { day, month } = dayAndMonth(s.date);
              return (
                <div key={s.id} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-13.5 flex-none text-center">
                    <div className="font-display text-xl leading-none font-bold">{day}</div>
                    <div className="text-[10.5px] font-bold text-text-soft uppercase">{month}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="m-0 mb-0.5 text-[14.5px] font-bold">{s.title}</h4>
                    <div className="text-xs text-text-soft">{s.time || ""} · Video call</div>
                  </div>
                  {s.video_link && /^https?:\/\//i.test(s.video_link) && (
                    <a
                      href={s.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-none items-center justify-center gap-2 rounded-lg bg-coral px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-105"
                    >
                      Join
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <SectionHead title="Past sessions" />
      <Card>
        {past.length === 0 ? (
          <EmptyState>Past sessions will appear here.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {past.map((s) => {
              const { day, month } = dayAndMonth(s.date);
              return (
                <div key={s.id} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-13.5 flex-none text-center">
                    <div className="font-display text-xl leading-none font-bold">{day}</div>
                    <div className="text-[10.5px] font-bold text-text-soft uppercase">{month}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="m-0 mb-0.5 text-[14.5px] font-bold">{s.title}</h4>
                    <div className="text-xs text-text-soft">Completed</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
