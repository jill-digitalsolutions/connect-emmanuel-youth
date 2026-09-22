"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import { createClient } from "@/lib/supabase/client";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";

export function AvatarMenu() {
  const profile = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useOnClickOutside(ref, () => setOpen(false));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Account"
        aria-label="Account"
      >
        <Avatar name={profile.name} avatarUrl={profile.avatar_url} size={36} />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-20 mt-2 w-56 rounded-2xl border border-line bg-surface p-3.5 shadow-lg">
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <Avatar name={profile.name} avatarUrl={profile.avatar_url} size={40} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold">{profile.name}</div>
              <div className="text-[12px] capitalize text-text-soft">{profile.role}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13.5px] font-semibold text-coral hover:bg-coral-bg"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
