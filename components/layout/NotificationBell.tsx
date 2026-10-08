"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, Image as ImageIcon, Megaphone, Video } from "lucide-react";
import clsx from "clsx";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { timeAgo } from "@/lib/utils/dates";
import type { AppNotification, NotificationKind, NotificationPrefs } from "@/lib/types/database.types";

const ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  announcement: Megaphone,
  banner: ImageIcon,
  fellowship: Video,
  reminder: Calendar,
};

const TYPES: { key: keyof Omit<NotificationPrefs, "user_id">; label: string }[] = [
  { key: "announcements", label: "Announcements" },
  { key: "banners", label: "New posters" },
  { key: "fellowship", label: "New online fellowships" },
  { key: "reminders", label: "Fellowship reminders (1 hour before)" },
];

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

type PushState = "loading" | "unsupported" | "blocked" | "off" | "on";

export function NotificationBell() {
  const me = useCurrentUser();
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Omit<NotificationPrefs, "user_id">>({
    announcements: true, banners: true, fellowship: true, reminders: true,
  });
  const [push, setPush] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  useOnClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [n, st, pr] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30),
        supabase.from("notification_state").select("seen_at").eq("user_id", me.id).maybeSingle(),
        supabase.from("notification_prefs").select("*").eq("user_id", me.id).maybeSingle(),
      ]);
      setItems(n.data ?? []);
      setSeenAt(st.data?.seen_at ?? "1970-01-01T00:00:00Z");
      if (pr.data) setPrefs(pr.data);
    })();
  }, [me.id]);

  useRealtimeTable<AppNotification>("notifications", (payload) => {
    if (payload.eventType === "INSERT" && payload.new?.id) {
      setItems((prev) => (prev.some((x) => x.id === payload.new.id) ? prev : [payload.new as AppNotification, ...prev].slice(0, 30)));
    }
  });

  // Is this device already subscribed to phone/browser alerts?
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !VAPID) {
        setPush("unsupported");
        return;
      }
      if (Notification.permission === "denied") return setPush("blocked");
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setPush(sub && Notification.permission === "granted" ? "on" : "off");
      } catch {
        setPush("off");
      }
    })();
  }, []);

  const unread = items.filter((i) => seenAt && i.created_at > seenAt).length;

  const markRead = useCallback(async () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    await createClient().from("notification_state").upsert({ user_id: me.id, seen_at: now });
  }, [me.id]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead();
  }

  async function setPref(key: keyof typeof prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await createClient().from("notification_prefs").upsert({ user_id: me.id, ...next });
    if (error) {
      setPrefs(prefs);
      toast(error.message);
    }
  }

  async function turnOn() {
    if (!VAPID) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID) }));
      const json = sub.toJSON();
      const { error } = await createClient().from("push_subscriptions").upsert(
        { user_id: me.id, endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
        { onConflict: "endpoint" }
      );
      if (error) throw error;
      setPush("on");
      toast("Notifications turned on for this device");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't turn on notifications");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setPush("off");
      toast("Notifications turned off for this device");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line bg-surface text-text transition hover:bg-page"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-extrabold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-4 py-3 text-[15px] font-bold">Notifications</div>

          <div className="max-h-[320px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="m-0 px-4 py-6 text-center text-[13px] text-text-soft">Nothing yet. New announcements, posters and fellowships show up here.</p>
            ) : (
              items.map((n) => {
                const Icon = ICON[n.kind];
                const isNew = seenAt ? n.created_at > seenAt : false;
                const inner = (
                  <div className={clsx("flex gap-3 px-4 py-3", isNew && "bg-accent-to/5")}>
                    <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-bg text-amber-ink">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] leading-snug font-bold text-text">{n.title}</div>
                      {n.body && <div className="mt-0.5 line-clamp-2 text-xs text-text-soft">{n.body}</div>}
                      <div className="mt-0.5 text-[11px] text-text-soft">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className="block no-underline hover:bg-page">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>

          <div className="border-t border-line bg-page px-4 py-3">
            <div className="text-[12px] font-extrabold tracking-wide text-text-soft uppercase">Alerts on this device</div>
            {push === "unsupported" ? (
              <p className="mt-1.5 mb-0 text-xs text-text-soft">
                Phone alerts aren&apos;t available here. On iPhone, add CONNECT to your Home Screen first (Share → Add to Home Screen), then open it from there.
              </p>
            ) : push === "blocked" ? (
              <p className="mt-1.5 mb-0 text-xs text-text-soft">
                Notifications are blocked in your browser settings. Allow them for this site, then come back here.
              </p>
            ) : (
              <label className="mt-1.5 flex cursor-pointer items-center justify-between gap-3">
                <span className="text-[13.5px] font-semibold">{push === "on" ? "On" : "Off"} — phone and browser alerts</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={push === "on"}
                  disabled={busy || push === "loading"}
                  onClick={push === "on" ? turnOff : turnOn}
                  className={clsx(
                    "relative h-6 w-11 flex-none rounded-full transition disabled:opacity-50",
                    push === "on" ? "bg-moss" : "bg-line"
                  )}
                >
                  <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", push === "on" ? "left-[22px]" : "left-0.5")} />
                </button>
              </label>
            )}

            <div className="mt-3 text-[12px] font-extrabold tracking-wide text-text-soft uppercase">Tell me about</div>
            <div className="mt-1 grid gap-1.5">
              {TYPES.map((t) => (
                <label key={t.key} className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <input type="checkbox" checked={prefs[t.key]} onChange={(e) => setPref(t.key, e.target.checked)} className="h-4 w-4" />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
