"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "@/components/ui/SectionHead";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput, FormRow, Select } from "@/components/ui/FormField";
import { ImageInput } from "@/components/ui/ImageInput";
import { PosterCard } from "./PosterCard";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { uploadToBucket } from "@/lib/utils/image";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import type { Banner, ColorTheme } from "@/lib/types/database.types";

export function BannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [title, setTitle] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [color, setColor] = useState<ColorTheme>("amber");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      let imageUrl: string | null = null;
      if (file) {
        imageUrl = await uploadToBucket("banners", file, "banners");
      }
      const supabase = createClient();
      const { error } = await supabase.from("banners").insert({
        title: title.trim(),
        event_date_label: dateLabel.trim() || "TBA",
        color_theme: color,
        image_url: imageUrl,
        is_past: false,
      });
      if (error) throw error;
      setTitle("");
      setDateLabel("");
      setFile(null);
      toast("Poster added");
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

  const { upcoming, past } = useMemo(
    () => ({
      upcoming: banners.filter((b) => !b.is_past),
      past: banners.filter((b) => b.is_past),
    }),
    [banners]
  );

  return (
    <div>
      {isAdmin && (
        <Card>
          <form onSubmit={handleSubmit}>
            <FieldLabel>Poster title</FieldLabel>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Youth Night: Ignite"
            />
            <FormRow>
              <div>
                <FieldLabel>Date shown</FieldLabel>
                <TextInput
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  placeholder="e.g. Sept 27"
                />
              </div>
              <div>
                <FieldLabel>Color</FieldLabel>
                <Select value={color} onChange={(e) => setColor(e.target.value as ColorTheme)}>
                  <option value="amber">Amber</option>
                  <option value="coral">Coral</option>
                  <option value="plum">Plum</option>
                  <option value="moss">Moss</option>
                </Select>
              </div>
            </FormRow>
            <FieldLabel>Poster image (optional)</FieldLabel>
            <ImageInput file={file} onChange={setFile} label="Upload a poster image" />
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
        <div className="grid grid-cols-2 gap-3.5 tablet:grid-cols-3 desktop:grid-cols-4">
          {upcoming.map((b) => (
            <PosterCard key={b.id} banner={b} onDelete={isAdmin ? () => handleDelete(b.id) : undefined} />
          ))}
        </div>
      )}

      <SectionHead title="Archive" />
      {past.length === 0 ? (
        <Card>
          <EmptyState>No past posters yet.</EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 tablet:grid-cols-3 desktop:grid-cols-4">
          {past.map((b) => (
            <PosterCard key={b.id} banner={b} onDelete={isAdmin ? () => handleDelete(b.id) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
