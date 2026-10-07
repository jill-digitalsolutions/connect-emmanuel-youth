import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/session";

export default async function RootPage() {
  redirect((await getUserId()) ? "/home" : "/login");
}
