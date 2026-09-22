import { getTasks } from "@/lib/queries/tasks";
import { BoardClient } from "@/components/board/BoardClient";

export default async function BoardPage() {
  const tasks = await getTasks();
  return <BoardClient initialTasks={tasks} />;
}
