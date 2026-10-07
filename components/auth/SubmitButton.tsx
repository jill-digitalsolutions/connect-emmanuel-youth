"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-from to-accent-to py-3.5 text-[15px] font-bold text-white shadow-lg shadow-accent-from/30 transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        <>
          {label} <span aria-hidden>→</span>
        </>
      )}
    </button>
  );
}
