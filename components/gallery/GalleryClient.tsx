"use client";

import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldLabel, TextInput, FormRow } from "@/components/ui/FormField";
import { ImageInput } from "@/components/ui/ImageInput";
import { Button } from "@/components/ui/Button";
import { Lightbox } from "./Lightbox";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { uploadToBucket } from "@/lib/utils/image";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import type { Photo, PhotoLike, PhotoComment } from "@/lib/types/database.types";
import type { PhotoWithUploader, GalleryData } from "@/lib/queries/photos";
import type { ProfileLite } from "@/lib/utils/profiles";

export function GalleryClient({
  initialData,
  profilesById,
}: {
  initialData: GalleryData;
  profilesById: Map<string, ProfileLite>;
}) {
  const [photos, setPhotos] = useState(initialData.photos);
  const [likesByPhoto, setLikesByPhoto] = useState(initialData.likesByPhoto);
  const [commentCounts, setCommentCounts] = useState(initialData.commentCounts);
  const [caption, setCaption] = useState("");
  const [album, setAlbum] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);
  const toast = useToast();
  const me = useCurrentUser();

  useRealtimeTable<Photo>("photos", (payload) => {
    setPhotos((prev) => {
      const merged = mergeChange(prev as unknown as Photo[], payload) as unknown as PhotoWithUploader[];
      return merged.map((p) =>
        p.uploader ? p : { ...p, uploader: profilesById.get(p.uploaded_by) ?? null }
      );
    });
  });

  useRealtimeTable<PhotoLike>("photo_likes", (payload) => {
    const row = (payload.new ?? payload.old) as PhotoLike;
    if (!row) return;
    setLikesByPhoto((prev) => {
      const current = prev[row.photo_id] ?? [];
      if (payload.eventType === "INSERT") {
        if (current.includes(row.user_id)) return prev;
        return { ...prev, [row.photo_id]: [...current, row.user_id] };
      }
      if (payload.eventType === "DELETE") {
        return { ...prev, [row.photo_id]: current.filter((id) => id !== row.user_id) };
      }
      return prev;
    });
  });

  useRealtimeTable<PhotoComment>("photo_comments", (payload) => {
    const row = (payload.new ?? payload.old) as PhotoComment;
    if (!row) return;
    setCommentCounts((prev) => {
      const delta = payload.eventType === "INSERT" ? 1 : payload.eventType === "DELETE" ? -1 : 0;
      if (delta === 0) return prev;
      return { ...prev, [row.photo_id]: Math.max(0, (prev[row.photo_id] ?? 0) + delta) };
    });
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast("Choose a photo to upload");
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = await uploadToBucket("gallery", file, me.id);
      const supabase = createClient();
      const { error } = await supabase.from("photos").insert({
        image_url: imageUrl,
        caption: caption.trim() || null,
        album: album.trim() || null,
        uploaded_by: me.id,
      });
      if (error) throw error;
      setFile(null);
      setCaption("");
      setAlbum("");
      toast("Photo shared");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(photoId: string) {
    const supabase = createClient();
    const liked = (likesByPhoto[photoId] ?? []).includes(me.id);
    if (liked) {
      await supabase.from("photo_likes").delete().eq("photo_id", photoId).eq("user_id", me.id);
    } else {
      await supabase.from("photo_likes").insert({ photo_id: photoId, user_id: me.id });
    }
  }

  async function deletePhoto(photoId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("photos").delete().eq("id", photoId);
    if (error) {
      toast(error.message);
      return;
    }
    setOpenPhotoId(null);
  }

  const openPhoto = photos.find((p) => p.id === openPhotoId) ?? null;
  const isAdmin = me.role === "admin";

  return (
    <div>
      <Card>
        <form onSubmit={handleUpload}>
          <FieldLabel>Share a photo</FieldLabel>
          <ImageInput file={file} onChange={setFile} label="Choose a photo to upload" />
          <FormRow>
            <div>
              <FieldLabel>Caption (optional)</FieldLabel>
              <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Say something about it" />
            </div>
            <div>
              <FieldLabel>Album / event (optional)</FieldLabel>
              <TextInput value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="e.g. Summer Retreat" />
            </div>
          </FormRow>
          <div className="mt-3.5">
            <Button type="submit" variant="plum" disabled={submitting}>
              {submitting ? "Uploading…" : "Share photo"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-5">
        {photos.length === 0 ? (
          <Card>
            <EmptyState>No photos yet — be the first to share one.</EmptyState>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
            {photos.map((p) => {
              const likeCount = (likesByPhoto[p.id] ?? []).length;
              const likedByMe = (likesByPhoto[p.id] ?? []).includes(me.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpenPhotoId(p.id)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-line text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt={p.caption ?? "Gallery photo"}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/60 to-transparent px-2.5 py-2 text-[11px] font-bold text-white">
                    <span className={clsx("flex items-center gap-1", likedByMe && "text-coral")}>
                      <Heart className={clsx("h-3.5 w-3.5", likedByMe && "fill-current")} /> {likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" /> {commentCounts[p.id] ?? 0}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openPhoto && (
        <Lightbox
          photo={openPhoto}
          likeCount={(likesByPhoto[openPhoto.id] ?? []).length}
          likedByMe={(likesByPhoto[openPhoto.id] ?? []).includes(me.id)}
          canDelete={isAdmin || openPhoto.uploaded_by === me.id}
          profilesById={profilesById}
          onClose={() => setOpenPhotoId(null)}
          onToggleLike={() => toggleLike(openPhoto.id)}
          onDeletePhoto={() => deletePhoto(openPhoto.id)}
        />
      )}
    </div>
  );
}
