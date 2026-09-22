import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Banner } from "@/lib/types/database.types";

export async function getBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
  return data ?? [];
}
