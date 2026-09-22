import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database.types";

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*");
  return data ?? [];
}
