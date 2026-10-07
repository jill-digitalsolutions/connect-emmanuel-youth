import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
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

export const getRealProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await getServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
});

export const VIEW_AS_COOKIE = "view-as";

// Admins can preview the app as a regular member. This only changes what the
// UI shows (and which actions it offers) — database permissions still follow
// the real account.
export const isPreviewingAsMember = cache(async (): Promise<boolean> => {
  const real = await getRealProfile();
  if (real?.role !== "admin") return false;
  return (await cookies()).get(VIEW_AS_COOKIE)?.value === "member";
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const real = await getRealProfile();
  if (real && (await isPreviewingAsMember())) return { ...real, role: "member" };
  return real;
});
