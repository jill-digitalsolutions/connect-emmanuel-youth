"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home, Megaphone, GraduationCap, Video, Image as ImageIcon, Images,
  Calendar, Kanban, MessageCircle, ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/utils/constants";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Megaphone,
  GraduationCap,
  Video,
  Image: ImageIcon,
  Images,
  Calendar,
  Kanban,
  MessageCircle,
  ShieldCheck,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const me = useCurrentUser();
  const items =
    me.role === "admin"
      ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: "ShieldCheck" } as const]
      : NAV_ITEMS;

  return (
    <aside className="flex h-full w-60 flex-none flex-col gap-1 bg-ink px-3.5 py-5.5 text-[#E9E7F6]">
      <div className="flex items-center gap-2.5 px-2.5 pt-1.5 pb-5.5">
        <Image src="/brand/connect-mark.png" alt="" width={34} height={24} className="h-auto w-[34px]" />
        <div>
          <div className="font-display text-[20px] font-semibold tracking-[0.2px] text-white">CONNECT</div>
          <div className="-mt-0.5 text-[11.5px] text-[#9C99BE]">Emmanuel Runners</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14.5px] font-semibold text-[#C7C4E2] transition",
                active ? "bg-ink-2 text-white shadow-[inset_3px_0_0_var(--color-amber)]" : "hover:bg-ink-2 hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px] flex-none opacity-90" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pt-3 pb-1 text-xs leading-relaxed text-[#706C93]">
        CONNECT — Emmanuel Runners
      </div>
    </aside>
  );
}
