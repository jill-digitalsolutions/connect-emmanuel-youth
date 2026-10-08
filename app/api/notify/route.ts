import { NextResponse } from "next/server";
import { getRealProfile, getServerClient } from "@/lib/supabase/session";
import { sendPush, type PrefKey } from "@/lib/push";

// Called by the app right after an admin posts something. The text is read
// from the database (never from the request), and only admins may trigger it.
export async function POST(request: Request) {
  const me = await getRealProfile();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const { kind, id } = (await request.json().catch(() => ({}))) as { kind?: string; id?: string };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const supabase = await getServerClient();

  let pref: PrefKey;
  let title: string;
  let body: string;
  let url: string;

  if (kind === "banner") {
    const { data } = await supabase.from("banners").select("title, event_date_label").eq("id", id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    [pref, title, body, url] = ["banners", "New poster", `${data.title} · ${data.event_date_label}`, "/banners"];
  } else if (kind === "fellowship") {
    const { data } = await supabase.from("sessions").select("title, date, time").eq("id", id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    [pref, title, body, url] = ["fellowship", "Online fellowship scheduled", `${data.title} · ${data.date}${data.time ? " " + data.time.slice(0, 5) : ""}`, "/fellowship"];
  } else if (kind === "announcement") {
    const { data } = await supabase.from("posts").select("title, body, category").eq("id", id).maybeSingle();
    if (!data || data.category !== "announcement") return NextResponse.json({ error: "Not found" }, { status: 404 });
    [pref, title, body, url] = ["announcements", "New announcement", data.title, "/feed"];
  } else {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await sendPush(pref, { title, body, url }, me.id);
  return NextResponse.json(result);
}
