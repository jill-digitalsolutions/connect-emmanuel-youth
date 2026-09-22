"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { TextInput, Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import type { Task, TaskStatus } from "@/lib/types/database.types";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "doing", label: "In progress" },
  { status: "done", label: "Done" },
];

export function BoardClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const me = useCurrentUser();

  useRealtimeTable<Task>("tasks", (payload) => {
    setTasks((prev) => mergeChange(prev, payload));
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast("Add a task title");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("tasks").insert({ title: title.trim(), created_by: me.id });
    setSubmitting(false);
    if (error) {
      toast(error.message);
      return;
    }
    setTitle("");
    toast("Task added");
  }

  async function updateStatus(id: string, status: TaskStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) toast(error.message);
  }

  async function removeTask(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast(error.message);
  }

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const c of COLUMNS) map.set(c.status, []);
    for (const t of tasks) map.get(t.status)?.push(t);
    return map;
  }, [tasks]);

  return (
    <div>
      <Card>
        <form onSubmit={handleAdd} className="flex gap-2.5">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task — e.g. Design October banner"
          />
          <div className="flex-none">
            <Button type="submit" variant="plum" disabled={submitting}>
              Add task
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 grid gap-3.5 tablet:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = byStatus.get(col.status) ?? [];
          return (
            <div key={col.status}>
              <div className="mb-2.5 flex items-center justify-between">
                <h4 className="m-0 text-[13.5px] font-extrabold">{col.label}</h4>
                <span className="rounded-full bg-page px-2 py-0.5 text-[11px] text-text-soft">
                  {list.length}
                </span>
              </div>
              {list.length === 0 ? (
                <div className="rounded-[10px] p-3.5 text-center text-[13px] text-text-soft">
                  Nothing here
                </div>
              ) : (
                list.map((t) => (
                  <div key={t.id} className="mb-2.5 rounded-[10px] border border-line bg-surface p-3">
                    <div className="text-[13px]">{t.title}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <Select
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value as TaskStatus)}
                        className="w-auto py-1 text-[11px]"
                      >
                        <option value="todo">To do</option>
                        <option value="doing">In progress</option>
                        <option value="done">Done</option>
                      </Select>
                      <button
                        type="button"
                        onClick={() => removeTask(t.id)}
                        className="text-[11px] text-text-soft underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
