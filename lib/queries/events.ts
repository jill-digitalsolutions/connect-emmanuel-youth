import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { CalendarEvent } from "@/lib/types/database.types";

export async function getEvents(): Promise<CalendarEvent[]> {
  const supabase = await getServerClient();
  const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
  return data ?? [];
}
