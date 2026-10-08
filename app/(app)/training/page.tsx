import { getProfile, getUserId } from "@/lib/supabase/session";
import { getTrainingCatalog } from "@/lib/queries/training";
import { TrainingClient } from "@/components/training/TrainingClient";

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) return null;
  const [catalog, { notice, error }, me] = await Promise.all([getTrainingCatalog(userId), searchParams, getProfile()]);
  return <TrainingClient catalog={catalog} notice={notice} error={error} isAdmin={me?.role === "admin"} />;
}
