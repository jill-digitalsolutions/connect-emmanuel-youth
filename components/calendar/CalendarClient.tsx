"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FormRow, Select } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { datesInRange, getMonthGrid, inferDatesFromLabel, monthLabel, todayIso, DOW } from "@/lib/utils/dates";
import type { Banner, CalendarEvent, ColorTheme, FellowshipSession } from "@/lib/types/database.types";

const CATEGORY_DOT: Record<ColorTheme, string> = {
  amber: "bg-amber-bg text-amber-ink",
  coral: "bg-coral-bg text-coral-ink",
  plum: "bg-plum-bg text-plum-ink",
  moss: "bg-moss-bg text-moss-ink",
};

type DayItem = { id: string; title: string; category: ColorTheme };

export function CalendarClient({
  initialEvents,
  initialBanners,
  initialSessions,
}: {
  initialEvents: CalendarEvent[];
  initialBanners: Banner[];
  initialSessions: FellowshipSession[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [banners, setBanners] = useState(initialBanners);
  const [sessions, setSessions] = useState(initialSessions);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<ColorTheme>("amber");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useRealtimeTable<CalendarEvent>("events", (payload) => {
    setEvents((prev) => mergeChange(prev, payload));
  });

  useRealtimeTable<Banner>("banners", (payload) => {
    setBanners((prev) => mergeChange(prev, payload));
  });
  useRealtimeTable<FellowshipSession>("sessions", (payload) => {
    setSessions((prev) => mergeChange(prev, payload));
  });

  const cells = useMemo(() => getMonthGrid(cursor), [cursor]);
  // Everything dated in the app shows here: calendar events, poster dates and
  // fellowship sessions. Poster/session entries are derived, so they never go
  // stale; an event with the same title and day takes precedence (no doubles).
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    const seen = new Set<string>();
    const add = (date: string, item: DayItem) => {
      const key = `${date}|${item.title.trim().toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      map.set(date, [...(map.get(date) ?? []), item]);
    };
    for (const e of events) add(e.date, e);
    for (const b of banners) {
      const d = b.event_date
        ? { start: b.event_date, end: b.event_end_date }
        : inferDatesFromLabel(b.event_date_label);
      if (!d.start) continue;
      for (const date of datesInRange(d.start, d.end)) {
        add(date, { id: `banner-${b.id}-${date}`, title: b.title, category: b.color_theme });
      }
    }
    for (const s of sessions) {
      add(s.date, { id: `session-${s.id}`, title: s.title, category: "coral" });
    }
    return map;
  }, [events, banners, sessions]);
  const today = todayIso();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast("Add a title and date");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").insert({ title: title.trim(), date, category });
    setSubmitting(false);
    if (error) {
      toast(error.message);
      return;
    }
    setCursor(new Date(`${date}T00:00:00`));
    setTitle("");
    setDate("");
    toast("Event added");
  }

  return (
    <div>
      <Card>
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="m-0 text-[17px] font-semibold">{monthLabel(cursor)}</h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {DOW.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-extrabold text-text-soft">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => {
            if (!cell.iso) return <div key={i} className="min-h-18 rounded-[10px] opacity-35" />;
            const dayEvents = eventsByDate.get(cell.iso) ?? [];
            const isToday = cell.iso === today;
            return (
              <div
                key={cell.iso}
                className={`min-h-18 rounded-[10px] border p-1.5 text-[11.5px] ${
                  isToday ? "border-accent-to shadow-[inset_0_0_0_1.5px_var(--color-accent-to)]" : "border-line"
                } bg-surface`}
              >
                <div className="text-xs font-extrabold">{cell.day}</div>
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className={`mt-0.5 truncate rounded px-1 py-0.5 text-[10px] font-bold ${CATEGORY_DOT[e.category]}`}
                  >
                    {e.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <form onSubmit={handleSubmit}>
          <FieldLabel>Add event</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          <FormRow>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select value={category} onChange={(e) => setCategory(e.target.value as ColorTheme)}>
              <option value="amber">Training</option>
              <option value="coral">Fellowship</option>
              <option value="plum">Announcement</option>
              <option value="moss">General</option>
            </Select>
          </FormRow>
          <div className="mt-3.5">
            <Button type="submit" variant="moss" disabled={submitting}>
              {submitting ? "Adding…" : "Add to calendar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
