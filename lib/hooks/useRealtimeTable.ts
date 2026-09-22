"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void,
  filter?: string
) {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();
    // A unique-per-mount topic (rather than one derived only from
    // table+filter) avoids colliding with a still-closing channel of the
    // same name — e.g. under React Strict Mode's dev-only double-invoke of
    // effects, which subscribes twice in a row and would otherwise reuse
    // realtime-js's internal channel registry entry, leaving no listener
    // attached once the first instance's cleanup tears it down.
    const topic = `rt:${table}:${filter ?? "all"}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => handlerRef.current(payload as RealtimePostgresChangesPayload<T>)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
