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
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // A unique-per-mount topic (rather than one derived only from
    // table+filter) avoids colliding with a still-closing channel of the
    // same name — e.g. under React Strict Mode's dev-only double-invoke of
    // effects, which subscribes twice in a row and would otherwise reuse
    // realtime-js's internal channel registry entry, leaving no listener
    // attached once the first instance's cleanup tears it down.
    const topic = `rt:${table}:${filter ?? "all"}:${Math.random().toString(36).slice(2)}`;

    // Explicitly hydrate the session and hand its access token to the
    // Realtime socket before subscribing. @supabase/ssr's browser client
    // reads the session from cookies asynchronously, so a channel that
    // subscribes immediately on mount can race ahead of that and connect
    // unauthenticated — Realtime then has no JWT to authorize the
    // postgres_changes subscription against RLS and silently delivers
    // nothing (surfaces as `errors: ["Error 401: Unauthorized"]` on the
    // payload rather than a thrown error).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter },
          (payload) => handlerRef.current(payload as RealtimePostgresChangesPayload<T>)
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
