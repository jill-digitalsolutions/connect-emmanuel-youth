import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { Photo } from "@/lib/types/database.types";

export interface PhotoWithUploader extends Photo {
  uploader: { name: string; avatar_url: string | null } | null;
}

export interface GalleryData {
  photos: PhotoWithUploader[];
  likesByPhoto: Record<string, string[]>; // photo_id -> user_ids who liked it
  commentCounts: Record<string, number>;
}

export async function getGalleryData(): Promise<GalleryData> {
  const supabase = await getServerClient();
  const [photosRes, likesRes, commentsRes] = await Promise.all([
    supabase
      .from("photos")
      .select("*, uploader:profiles!photos_uploaded_by_fkey(name, avatar_url)")
      .order("created_at", { ascending: false }),
    supabase.from("photo_likes").select("photo_id, user_id"),
    supabase.from("photo_comments").select("photo_id"),
  ]);

  const likesByPhoto: Record<string, string[]> = {};
  for (const l of likesRes.data ?? []) {
    (likesByPhoto[l.photo_id] ??= []).push(l.user_id);
  }

  const commentCounts: Record<string, number> = {};
  for (const c of commentsRes.data ?? []) {
    commentCounts[c.photo_id] = (commentCounts[c.photo_id] ?? 0) + 1;
  }

  return {
    photos: (photosRes.data ?? []) as unknown as PhotoWithUploader[],
    likesByPhoto,
    commentCounts,
  };
}
