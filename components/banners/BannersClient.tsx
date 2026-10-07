"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "@/components/ui/SectionHead";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FormRow, Select } from "@/components/ui/FormField";
import { ImageInput } from "@/components/ui/ImageInput";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { PosterCard } from "./PosterCard";
import { PosterViewer } from "./PosterViewer";
import { LayoutOptions, DEFAULT_LAYOUT, type BannerLayout } from "./LayoutOptions";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { uploadToBucket } from "@/lib/utils/image";
import { formatDateRange, todayIso } from "@/lib/utils/dates";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import type { Banner, ColorTheme } from "@/lib/types/database.types";

const NEW_FIELDS = ["image_fit", "image_x", "image_y", "image_zoom", "text_position", "text_align", "event_date", "event_end_date"] as const;

function stripNewFields<T extends Record<string, unknown>>(row: T) {
  const copy: Record<string, unknown> = { ...row };
  for (const k of NEW_FIELDS) delete copy[k];
  return copy;
}

function isPast(b: Banner, today: string) {
  if (b.is_past) return true;
  const last = b.event_end_date ?? b.event_date;
  return Boolean(last && last < today);
}

export function BannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState<ColorTheme>("amber");
  const [layout, setLayout] = useState<BannerLayout>(DEFAULT_LAYOUT);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [viewing, setViewing] = useState<Banner | null>(null);
  const toast = useToast();
  const me = useCurrentUser();
  const isAdmin = me.role === "admin";

  useRealtimeTable<Banner>("banners", (payload) => {
    setBanners((prev) => mergeChange(prev, payload));
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast("Add a poster title");
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = file ? await uploadToBucket("banners", file, "banners") : null;
      const row = {
        title: title.trim(),
        event_date_label: startDate ? formatDateRange(startDate, endDate || null) : "TBA",
        event_date: startDate || null,
        event_end_date: endDate || null,
        color_theme: color,
        image_url: imageUrl,
        is_past: false,
        ...layout,
      };
      const supabase = createClient();
      let { error } = await supabase.from("banners").insert(row);
      if (error) {
        // Database not yet upgraded with the date/layout columns: save without them.
        ({ error } = await supabase.from("banners").insert(stripNewFields(row) as typeof row));
        if (!error) toast("Saved. Dates and layout options need the banner SQL update in Supabase.");
      } else {
        toast("Poster added");
      }
      if (error) throw error;
      setTitle("");
      setStartDate("");
      setEndDate("");
      setFile(null);
      setLayout(DEFAULT_LAYOUT);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) toast(error.message);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const supabase = createClient();
    const update = {
      title: editing.title.trim() || editing.title,
      color_theme: editing.color_theme,
      event_date: editing.event_date || null,
      event_end_date: editing.event_end_date || null,
      event_date_label: editing.event_date
        ? formatDateRange(editing.event_date, editing.event_end_date)
        : editing.event_date_label,
      image_fit: editing.image_fit ?? "contain",
      image_x: editing.image_x ?? 50,
      image_y: editing.image_y ?? 50,
      image_zoom: editing.image_zoom ?? 100,
      text_position: editing.text_position ?? "bottom",
      text_align: editing.text_align ?? "left",
    };
    const { error } = await supabase.from("banners").update(update).eq("id", editing.id);
    if (error) {
      toast(/column/i.test(error.message) ? "Run the banner SQL update in Supabase first." : error.message);
      return;
    }
    setEditing(null);
    toast("Poster updated");
  }

  const { upcoming, past } = useMemo(() => {
    const today = todayIso();
    const byDateAsc = (a: Banner, b: Banner) =>
      (a.event_date ?? "9999-12-31").localeCompare(b.event_date ?? "9999-12-31") ||
      b.created_at.localeCompare(a.created_at);
    const byDateDesc = (a: Banner, b: Banner) =>
      (b.event_date ?? "").localeCompare(a.event_date ?? "") || b.created_at.localeCompare(a.created_at);
    return {
      upcoming: banners.filter((b) => !isPast(b, today)).sort(byDateAsc),
      past: banners.filter((b) => isPast(b, today)).sort(byDateDesc),
    };
  }, [banners]);

  const poster = (b: Banner) => (
    <PosterCard
      key={b.id}
      banner={b}
      onView={() => setViewing(b)}
      onEdit={isAdmin ? () => setEditing(b) : undefined}
      onDelete={isAdmin ? () => handleDelete(b.id) : undefined}
    />
  );

  return (
    <div>
      {isAdmin && (
        <Card>
          <form onSubmit={handleSubmit}>
            <FieldLabel>Poster title</FieldLabel>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Youth Night: Ignite" />
            <FormRow>
              <div>
                <FieldLabel>Date</FieldLabel>
                <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <FieldLabel>End date (optional)</FieldLabel>
                <TextInput type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </FormRow>
            <FieldLabel>Color</FieldLabel>
            <Select value={color} onChange={(e) => setColor(e.target.value as ColorTheme)}>
              <option value="amber">Amber</option>
              <option value="coral">Coral</option>
              <option value="plum">Plum</option>
              <option value="moss">Moss</option>
            </Select>
            <FieldLabel>Poster image (optional)</FieldLabel>
            <ImageInput file={file} onChange={setFile} label="Upload a poster image" />
            <LayoutOptions value={layout} onChange={setLayout} />
            <p className="mt-3 mb-0 text-xs text-text-soft">
              Posters sort by date automatically and move to the Archive after their date passes.
            </p>
            <div className="mt-3.5">
              <Button type="submit" variant="plum" disabled={submitting}>
                {submitting ? "Adding…" : "Add poster"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <SectionHead title="Upcoming" />
      {upcoming.length === 0 ? (
        <Card>
          <EmptyState>No upcoming posters.</EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 tablet:grid-cols-3 desktop:grid-cols-4">{upcoming.map(poster)}</div>
      )}

      <SectionHead title="Archive" />
      {past.length === 0 ? (
        <Card>
          <EmptyState>No past posters yet.</EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 tablet:grid-cols-3 desktop:grid-cols-4">{past.map(poster)}</div>
      )}

      {viewing && <PosterViewer banner={viewing} onClose={() => setViewing(null)} />}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleSaveEdit}>
            <h3 className="m-0 mb-1 text-[17px] font-semibold">Edit poster</h3>
            <FieldLabel>Title</FieldLabel>
            <TextInput value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <FormRow>
              <div>
                <FieldLabel>Date</FieldLabel>
                <TextInput
                  type="date"
                  value={editing.event_date ?? ""}
                  onChange={(e) => setEditing({ ...editing, event_date: e.target.value || null })}
                />
              </div>
              <div>
                <FieldLabel>End date</FieldLabel>
                <TextInput
                  type="date"
                  value={editing.event_end_date ?? ""}
                  onChange={(e) => setEditing({ ...editing, event_end_date: e.target.value || null })}
                />
              </div>
            </FormRow>
            <LayoutOptions
              value={{
                image_fit: editing.image_fit ?? "contain",
                image_x: editing.image_x ?? 50,
      image_y: editing.image_y ?? 50,
      image_zoom: editing.image_zoom ?? 100,
                text_position: editing.text_position ?? "bottom",
                text_align: editing.text_align ?? "left",
              }}
              onChange={(l) => setEditing({ ...editing, ...l })}
            />
            <p className="mt-3 mb-1.5 text-center text-xs text-text-soft">
              Drag the preview to move the poster so the important text stays visible.
            </p>
            <div
              className="mx-auto w-44 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={(e) => {
                const el = e.currentTarget;
                el.setPointerCapture(e.pointerId);
                const start = { x: e.clientX, y: e.clientY, ix: editing.image_x ?? 50, iy: editing.image_y ?? 50 };
                const move = (ev: PointerEvent) => {
                  const r = el.getBoundingClientRect();
                  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
                  setEditing((cur) =>
                    cur
                      ? {
                          ...cur,
                          image_x: clamp(start.ix - ((ev.clientX - start.x) / r.width) * 100),
                          image_y: clamp(start.iy - ((ev.clientY - start.y) / r.height) * 100),
                        }
                      : cur
                  );
                };
                const up = () => {
                  el.removeEventListener("pointermove", move);
                  el.removeEventListener("pointerup", up);
                };
                el.addEventListener("pointermove", move);
                el.addEventListener("pointerup", up);
              }}
            >
              <PosterCard banner={editing} />
            </div>
            <ModalActions>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="plum">
                Save
              </Button>
            </ModalActions>
          </form>
        )}
      </Modal>
    </div>
  );
}
