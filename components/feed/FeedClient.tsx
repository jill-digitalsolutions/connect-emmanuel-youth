"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "@/components/ui/SectionHead";
import { FieldLabel, TextInput, TextArea, Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { mergeChange } from "@/lib/utils/realtime";
import { timeAgo } from "@/lib/utils/dates";
import { POST_CATEGORY_COLOR } from "@/lib/utils/constants";
import type { Post, PostCategory } from "@/lib/types/database.types";
import type { PostWithAuthor } from "@/lib/queries/posts";
import type { ProfileLite } from "@/lib/utils/profiles";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";

export function FeedClient({
  initialPosts,
  profilesById,
}: {
  initialPosts: PostWithAuthor[];
  profilesById: Map<string, ProfileLite>;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("announcement");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const me = useCurrentUser();

  useRealtimeTable<Post>("posts", (payload) => {
    setPosts((prev) => {
      const merged = mergeChange(prev, payload);
      return merged.map((p) =>
        "author" in p ? p : { ...p, author: profilesById.get(p.author_id) ?? null }
      ) as PostWithAuthor[];
    });
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast("Add a title first");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("posts").insert({
      title: title.trim(),
      body: body.trim() || null,
      category,
      author_id: me.id,
    });
    setSubmitting(false);
    if (error) {
      toast(error.message);
      return;
    }
    setTitle("");
    setBody("");
    toast("Posted to the feed");
  }

  const sorted = useMemo(
    () => [...posts].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [posts]
  );

  return (
    <div>
      <Card>
        <form onSubmit={handleSubmit}>
          <FieldLabel>New announcement title</FieldLabel>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sign-ups open for Leadership Retreat"
          />
          <FieldLabel>Details</FieldLabel>
          <TextArea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add the details everyone needs..."
          />
          <FieldLabel>Category</FieldLabel>
          <Select value={category} onChange={(e) => setCategory(e.target.value as PostCategory)}>
            <option value="training">Training</option>
            <option value="fellowship">Fellowship</option>
            <option value="announcement">Announcement</option>
            <option value="calendar">Calendar</option>
          </Select>
          <div className="mt-3.5">
            <Button type="submit" variant="amber" disabled={submitting}>
              {submitting ? "Posting…" : "Post to feed"}
            </Button>
          </div>
        </form>
      </Card>

      <SectionHead title="All posts" />
      <Card>
        {sorted.length === 0 ? (
          <EmptyState>No announcements yet. Post your first one above.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {sorted.map((p) => (
              <div key={p.id} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-2 flex items-center gap-2.5">
                  <Tag color={POST_CATEGORY_COLOR[p.category]} />
                  <Avatar name={p.author?.name ?? "Member"} avatarUrl={p.author?.avatar_url} size={22} />
                  <span className="text-[13.5px] font-bold">{p.author?.name ?? "Member"}</span>
                  <span className="text-xs text-text-soft">· {timeAgo(p.created_at)}</span>
                </div>
                <h4 className="m-0 mb-1.5 text-[15.5px] font-bold">{p.title}</h4>
                {p.body && <p className="m-0 text-sm leading-relaxed text-text-soft">{p.body}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
