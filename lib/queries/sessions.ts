import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { FellowshipSession } from "@/lib/types/database.types";

export async function getSessions(): Promise<FellowshipSession[]> {
  const supabase = await getServerClient();
  const { data } = await supabase.from("sessions").select("*").order("date", { ascending: true });
  return data ?? [];
}
