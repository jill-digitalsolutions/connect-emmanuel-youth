"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen tablet:flex">
      <div
        className={`fixed inset-0 z-30 bg-black/45 tablet:hidden ${open ? "block" : "hidden"}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-250 tablet:static tablet:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      <div className="min-w-0 flex-1">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="px-5 py-6.5 pb-15 tablet:px-7">
          <div className="desktop:mx-auto desktop:max-w-[980px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
