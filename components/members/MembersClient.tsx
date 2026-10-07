"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHead } from "@/components/ui/SectionHead";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import { createClient } from "@/lib/supabase/client";
import { uploadToBucket, validateImageFile } from "@/lib/utils/image";
import type { Profile } from "@/lib/types/database.types";

export function MembersClient({ members }: { members: Profile[] }) {
  const me = useCurrentUser();
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);

  const q = query.trim().toLowerCase().replace(/^@/, "");
  const shown = useMemo(
    () =>
      members.filter(
        (m) => !q || m.name.toLowerCase().includes(q) || (m.username ?? "").toLowerCase().includes(q)
      ),
    [members, q]
  );

  async function changePhoto(file: File | undefined) {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast(problem);
      return;
    }
    setUploading(true);
    try {
      // Stored under the member's own folder, which is the only place the
      // gallery bucket lets them write.
      const url = await uploadToBucket("gallery", file, `${me.id}/avatar`);
      const { error } = await createClient().rpc("set_my_avatar", { p_url: url });
      if (error) {
        toast(/set_my_avatar/.test(error.message) ? "Photos aren't set up yet — run the avatar SQL in Supabase." : error.message);
        return;
      }
      setMyPhoto(url);
      toast("Display photo updated");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const myProfile = members.find((m) => m.id === me.id);

  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <label className="group relative cursor-pointer" aria-label="Change your display photo">
            <Avatar name={me.name} avatarUrl={myPhoto ?? myProfile?.avatar_url ?? me.avatar_url} size={72} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100 pointer-coarse:opacity-100">
              <Camera className="h-5 w-5" />
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                changePhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <div className="min-w-0">
            <div className="truncate text-[17px] font-bold">{me.name}</div>
            <div className="text-[13px] text-text-soft">{me.username ? `@${me.username}` : "no username"}</div>
            <div className="mt-1 text-xs font-semibold text-accent-to">
              {uploading ? "Uploading…" : "Tap your photo to change it"}
            </div>
          </div>
        </div>
      </Card>

      <SectionHead title={`All members (${members.length})`} />
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or @username"
          className="w-full rounded-full border border-line bg-surface py-2.5 pr-4 pl-10 text-[14px] text-text focus:border-accent-to focus:outline-none"
        />
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState>No members match “{query}”.</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
          {shown.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 p-3.5!">
              <Avatar name={m.name} avatarUrl={m.id === me.id ? (myPhoto ?? m.avatar_url) : m.avatar_url} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-bold">
                  {m.name}
                  {m.id === me.id && <span className="ml-1.5 text-xs font-semibold text-text-soft">(you)</span>}
                </div>
                <div className="truncate text-[13px] text-text-soft">{m.username ? `@${m.username}` : "no username"}</div>
              </div>
              {m.role === "admin" && (
                <span className="rounded-full bg-plum-bg px-2 py-0.5 text-[10px] font-extrabold text-plum-ink">Admin</span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
