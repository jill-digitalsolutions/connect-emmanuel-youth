import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PrefKey = "announcements" | "banners" | "fellowship" | "reminders";
export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export function pushConfigured() {
  return Boolean(
    process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Sends a push to every device whose owner hasn't switched this type off.
export async function sendPush(pref: PrefKey, payload: PushPayload, excludeUserId?: string) {
  const admin = createAdminClient();
  if (!pushConfigured() || !admin) return { sent: 0, skipped: true };

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@connect-emmanuel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const [subs, prefs] = await Promise.all([
    admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth"),
    admin.from("notification_prefs").select("*"),
  ]);
  const off = new Set((prefs.data ?? []).filter((p) => p[pref] === false).map((p) => p.user_id));

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    (subs.data ?? [])
      .filter((s) => s.user_id !== excludeUserId && !off.has(s.user_id))
      .map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
            { TTL: 3600 }
          );
          sent++;
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) dead.push(s.id);
        }
      })
  );
  if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);
  return { sent, skipped: false };
}
