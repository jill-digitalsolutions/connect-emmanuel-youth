import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function mergeChange<T extends { id: string }>(
  list: T[],
  payload: RealtimePostgresChangesPayload<T>
): T[] {
  if (payload.eventType === "INSERT") {
    const row = payload.new as T;
    if (list.some((r) => r.id === row.id)) return list;
    return [row, ...list];
  }
  if (payload.eventType === "UPDATE") {
    const row = payload.new as T;
    return list.map((r) => (r.id === row.id ? row : r));
  }
  if (payload.eventType === "DELETE") {
    const row = payload.old as T;
    return list.filter((r) => r.id !== row.id);
  }
  return list;
}
