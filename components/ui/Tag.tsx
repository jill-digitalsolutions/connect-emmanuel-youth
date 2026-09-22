import clsx from "clsx";

export type TagColor = "amber" | "coral" | "plum" | "moss";

const colorClasses: Record<TagColor, string> = {
  amber: "bg-amber-bg text-amber-ink",
  coral: "bg-coral-bg text-coral-ink",
  plum: "bg-plum-bg text-plum-ink",
  moss: "bg-moss-bg text-moss-ink",
};

const CATEGORY_LABELS: Record<TagColor, string> = {
  amber: "Training",
  coral: "Fellowship",
  plum: "Announcement",
  moss: "Calendar",
};

export function Tag({ color, children }: { color: TagColor; children?: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        colorClasses[color]
      )}
    >
      {children ?? CATEGORY_LABELS[color]}
    </span>
  );
}
