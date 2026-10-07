import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { Task } from "@/lib/types/database.types";

export async function getTasks(): Promise<Task[]> {
  const supabase = await getServerClient();
  const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
  return data ?? [];
}
