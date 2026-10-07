import "server-only";
import { getServerClient } from "@/lib/supabase/session";
import type { Banner } from "@/lib/types/database.types";

export async function getBanners(): Promise<Banner[]> {
  const supabase = await getServerClient();
  const { data } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
  return data ?? [];
}
