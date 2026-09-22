"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Heart, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { timeAgo } from "@/lib/utils/dates";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import { useToast } from "@/components/ui/Toast";
import type { PhotoComment } from "@/lib/types/database.types";
import type { PhotoWithUploader } from "@/lib/queries/photos";
import type { ProfileLite } from "@/lib/utils/profiles";

interface CommentWithAuthor extends PhotoComment {
  author?: ProfileLite;
}

export function Lightbox({
  photo,
  likeCount,
  likedByMe,
  canDelete,
  profilesById,
  onClose,
  onToggleLike,
  onDeletePhoto,
}: {
  photo: PhotoWithUploader;
  likeCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  profilesById: Map<string, ProfileLite>;
  onClose: () => void;
  onToggleLike: () => void;
  onDeletePhoto: () => void;
}) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [text, setText] = useState("");
  const me = useCurrentUser();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("photo_comments")
      .select("*")
      .eq("photo_id", photo.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setComments((data ?? []).map((c) => ({ ...c, author: profilesById.get(c.user_id) })));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [photo.id, profilesById]);

  useRealtimeTable<PhotoComment>(
    "photo_comments",
    (payload) => {
      setComments((prev) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new;
          if (prev.some((c) => c.id === row.id)) return prev;
          return [...prev, { ...row, author: profilesById.get(row.user_id) }];
        }
        if (payload.eventType === "DELETE") {
          return prev.filter((c) => c.id !== payload.old.id);
        }
        return prev;
      });
    },
    `photo_id=eq.${photo.id}`
  );

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("photo_comments")
      .insert({ photo_id: photo.id, user_id: me.id, body: text.trim() });
    if (error) {
      toast(error.message);
      return;
    }
    setText("");
  }

  async function deleteComment(id: string) {
    const supabase = createClient();
    await supabase.from("photo_comments").delete().eq("id", id);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface tablet:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.image_url} alt={photo.caption ?? "Gallery photo"} className="h-full w-full object-contain" />
        </div>

        <div className="flex w-full flex-col tablet:w-80">
          <div className="flex items-center gap-2.5 border-b border-line p-4">
            <Avatar name={photo.uploader?.name ?? "Member"} avatarUrl={photo.uploader?.avatar_url} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold">{photo.uploader?.name ?? "Member"}</div>
              <div className="text-[11px] text-text-soft">{timeAgo(photo.created_at)}</div>
            </div>
            {canDelete && (
              <button type="button" onClick={onDeletePhoto} aria-label="Delete photo" className="text-text-soft hover:text-coral">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {photo.caption && <p className="m-0 border-b border-line p-4 text-[13.5px]">{photo.caption}</p>}

          <div className="flex items-center gap-2 border-b border-line p-4">
            <button
              type="button"
              onClick={onToggleLike}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold transition",
                likedByMe ? "bg-coral-bg text-coral-ink" : "bg-page text-text-soft hover:bg-line/50"
              )}
            >
              <Heart className={clsx("h-4 w-4", likedByMe && "fill-current")} />
              {likeCount}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {comments.length === 0 ? (
              <EmptyState>No comments yet.</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Avatar name={c.author?.name ?? "Member"} avatarUrl={c.author?.avatar_url} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px]">
                        <span className="font-bold">{c.author?.name ?? "Member"}</span>{" "}
                        <span>{c.body}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-text-soft">
                        <span>{timeAgo(c.created_at)}</span>
                        {c.user_id === me.id && (
                          <button type="button" onClick={() => deleteComment(c.id)} className="underline">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submitComment} className="flex gap-2 border-t border-line p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-full border border-line bg-page px-3.5 py-2 text-[13px]"
            />
            <button type="submit" className="text-[13px] font-bold text-accent-from">
              Post
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
