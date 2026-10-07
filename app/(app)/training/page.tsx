import { getUserId } from "@/lib/supabase/session";
import { getCoursesForUser } from "@/lib/queries/training";
import { TrainingClient } from "@/components/training/TrainingClient";

export default async function TrainingPage() {
  const userId = await getUserId();
  if (!userId) return null;

  const courses = await getCoursesForUser(userId);
  return <TrainingClient initialCourses={courses} />;
}
