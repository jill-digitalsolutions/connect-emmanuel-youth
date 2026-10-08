import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/push";

// Where the youth group meets. Fellowship times are stored without a time zone,
// so reminders read them in this offset (Philippines / Singapore = +08:00).
const GROUP_UTC_OFFSET = "+08:00";
const REMIND_WITHIN_MIN = 65;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service key not set" }, { status: 503 });

  const now = Date.now();
  const day = (offsetDays: number) => new Date(now + offsetDays * 86400000).toISOString().slice(0, 10);
  const { data: sessions } = await admin
    .from("sessions")
    .select("id, title, date, time")
    .not("time", "is", null)
    .gte("date", day(-1))
    .lte("date", day(1));

  const due = (sessions ?? []).filter((s) => {
    const start = new Date(`${s.date}T${s.time}${GROUP_UTC_OFFSET}`).getTime();
    const minutes = (start - now) / 60000;
    return minutes > 0 && minutes <= REMIND_WITHIN_MIN;
  });

  let reminded = 0;
  for (const s of due) {
    // Claim the reminder first so two overlapping runs can't both send it.
    const { error } = await admin.from("session_reminders").insert({ session_id: s.id });
    if (error) continue;
    const body = `${s.title} starts in about an hour (${s.time!.slice(0, 5)}).`;
    await admin.from("notifications").insert({ kind: "reminder", title: "Fellowship starting soon", body, link: "/fellowship" });
    await sendPush("reminders", { title: "Fellowship starting soon", body, url: "/fellowship" });
    reminded++;
  }
  return NextResponse.json({ checked: sessions?.length ?? 0, reminded });
}

export const GET = run;
export const POST = run;
