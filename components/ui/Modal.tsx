"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[86vh] w-full max-w-[420px] overflow-auto rounded-2xl bg-surface p-5.5">
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-4.5 flex gap-2.5 [&>*]:flex-1 [&>*]:justify-center">{children}</div>;
}
