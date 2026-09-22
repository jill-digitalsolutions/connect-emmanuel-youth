"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { AvatarMenu } from "./AvatarMenu";
import { PAGE_META } from "@/lib/utils/constants";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "CONNECT", subtitle: "" };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4.5 tablet:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-text tablet:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="m-0 text-[22px] font-semibold">{meta.title}</h1>
          {meta.subtitle && <p className="mt-0.5 text-[13.5px] text-text-soft">{meta.subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-none items-center gap-2.5">
        <ThemeToggle />
        <AvatarMenu />
      </div>
    </div>
  );
}
