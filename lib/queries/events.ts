import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types/database.types";

export async function getEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
  return data ?? [];
}
