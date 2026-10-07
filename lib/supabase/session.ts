import "server-only";
import { cache } from "react";
import { createClient } from "./server";
import type { Profile } from "@/lib/types/database.types";

// React's cache() dedupes these per request, so the layout and the page
// share one auth check and one profile fetch instead of repeating them.
export const getServerClient = cache(createClient);

export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await getServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
});
