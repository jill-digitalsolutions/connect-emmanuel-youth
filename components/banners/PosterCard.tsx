import { POSTER_GRADIENTS } from "@/lib/utils/constants";
import type { Banner } from "@/lib/types/database.types";

export function PosterCard({ banner, onDelete }: { banner: Banner; onDelete?: () => void }) {
  return (
    <div
      className="relative aspect-3/4 overflow-hidden rounded-xl border border-line"
      style={banner.image_url ? undefined : { background: POSTER_GRADIENTS[banner.color_theme] }}
    >
      {banner.image_url && (
        <>
          {/* A blurred copy fills the card behind the poster; the poster itself is
              centered and shown whole, whatever its shape. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image_url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image_url}
            alt={banner.title}
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
      {banner.is_past && (
        <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-black/50 px-2 py-1 text-[10px] font-extrabold text-white">
          Past
        </span>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-2.5 left-2.5 z-10 rounded-full bg-black/50 px-2 py-1 text-[10px] font-extrabold text-white hover:bg-black/70"
        >
          Delete
        </button>
      )}
      <div className="absolute right-0 bottom-0 left-0 z-10 p-3 text-white">
        <div className="font-display text-[15px] leading-tight font-bold">{banner.title}</div>
        <div className="mt-0.5 text-[11px] opacity-85">{banner.event_date_label}</div>
      </div>
    </div>
  );
}
