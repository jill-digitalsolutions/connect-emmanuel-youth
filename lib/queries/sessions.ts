import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FellowshipSession } from "@/lib/types/database.types";

export async function getSessions(): Promise<FellowshipSession[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("*").order("date", { ascending: true });
  return data ?? [];
}
