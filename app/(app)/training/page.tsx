import { createClient } from "@/lib/supabase/server";
import { getCoursesForUser } from "@/lib/queries/training";
import { TrainingClient } from "@/components/training/TrainingClient";

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const courses = await getCoursesForUser(user.id);
  return <TrainingClient initialCourses={courses} />;
}
