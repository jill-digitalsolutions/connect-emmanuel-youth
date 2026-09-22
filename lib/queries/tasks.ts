import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types/database.types";

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
  return data ?? [];
}
