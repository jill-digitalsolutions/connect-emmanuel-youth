import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { Profile } from "@/lib/types/database.types";

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await getServerClient();
  const { data } = await supabase.from("profiles").select("*");
  return data ?? [];
}
