"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { POSTER_GRADIENTS } from "@/lib/utils/constants";
import type { Banner } from "@/lib/types/database.types";

export function PosterViewer({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={banner.title}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <X className="h-5 w-5" />
      </button>

      {banner.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.image_url}
          alt={banner.title}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
      ) : (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex aspect-3/4 max-h-[80vh] w-[min(88vw,420px)] items-end rounded-xl p-6 text-white"
          style={{ background: POSTER_GRADIENTS[banner.color_theme] }}
        >
          <div className="font-display text-3xl leading-tight font-bold">{banner.title}</div>
        </div>
      )}

      <div className="mt-4 text-center text-white" onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-lg font-bold">{banner.title}</div>
        <div className="text-sm opacity-80">{banner.event_date_label}</div>
      </div>
    </div>,
    document.body
  );
}
