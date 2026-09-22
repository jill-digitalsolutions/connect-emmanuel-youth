import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/database.types";

export interface PostWithAuthor extends Post {
  author: { name: string; avatar_url: string | null } | null;
}

export async function getPosts(): Promise<PostWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(name, avatar_url)")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as PostWithAuthor[];
}
