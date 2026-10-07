import clsx from "clsx";
import { POSTER_GRADIENTS } from "@/lib/utils/constants";
import type { Banner } from "@/lib/types/database.types";

const TEXT_BLOCK = {
  top: "top-0 bg-gradient-to-b from-black/60 to-transparent pb-8",
  center: "top-1/2 -translate-y-1/2 bg-black/45 py-3",
  bottom: "bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-8",
} as const;

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

export function PosterCard({
  banner,
  onDelete,
  onEdit,
  onView,
}: {
  banner: Banner;
  onDelete?: () => void;
  onEdit?: () => void;
  onView?: () => void;
}) {
  const fit = banner.image_fit ?? "contain";
  const x = banner.image_x ?? 50;
  const y = banner.image_y ?? 50;
  const zoom = (banner.image_zoom ?? 100) / 100;
  const textPosition = banner.text_position ?? "bottom";
  const textAlign = banner.text_align ?? "left";

  return (
    <div
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
      aria-label={onView ? `View ${banner.title} full size` : undefined}
      onClick={onView}
      onKeyDown={
        onView
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onView();
              }
            }
          : undefined
      }
      className={clsx(
        "relative aspect-3/4 overflow-hidden rounded-xl border border-line",
        onView && "cursor-zoom-in transition hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent-to"
      )}
      style={banner.image_url ? undefined : { background: POSTER_GRADIENTS[banner.color_theme] }}
    >
      {banner.image_url && (
        <>
          {/* A blurred copy fills the card behind the poster so "show whole
              poster" never leaves empty bars. */}
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
            draggable={false}
            style={{
              objectPosition: `${x}% ${y}%`,
              transformOrigin: `${x}% ${y}%`,
              transform: zoom > 1 ? `scale(${zoom})` : undefined,
            }}
            className={clsx(
              "absolute inset-0 h-full w-full select-none",
              fit === "cover" ? "object-cover" : "object-contain"
            )}
          />
        </>
      )}
      {banner.is_past && (
        <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-black/50 px-2 py-1 text-[10px] font-extrabold text-white">
          Past
        </span>
      )}
      {(onEdit || onDelete) && (
        <div className="absolute top-2.5 left-2.5 z-20 flex gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-extrabold text-white hover:bg-black/75"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-extrabold text-white hover:bg-black/75"
            >
              Delete
            </button>
          )}
        </div>
      )}
      <div className={clsx("absolute right-0 left-0 z-10 px-3 text-white", TEXT_BLOCK[textPosition], ALIGN[textAlign])}>
        <div className="font-display text-[15px] leading-tight font-bold [text-shadow:0_1px_6px_rgba(0,0,0,.55)]">
          {banner.title}
        </div>
        <div className="mt-0.5 text-[11px] opacity-90 [text-shadow:0_1px_6px_rgba(0,0,0,.55)]">
          {banner.event_date_label}
        </div>
      </div>
    </div>
  );
}
