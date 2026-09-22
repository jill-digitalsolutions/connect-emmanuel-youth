import clsx from "clsx";

type Accent = "amber" | "coral" | "plum" | "moss";

const accentBorder: Record<Accent, string> = {
  amber: "border-l-4 border-l-amber",
  coral: "border-l-4 border-l-coral",
  plum: "border-l-4 border-l-plum",
  moss: "border-l-4 border-l-moss",
};

export function Card({
  className,
  accent,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { accent?: Accent }) {
  return (
    <div
      className={clsx(
        "rounded-[14px] border border-line bg-surface p-[18px]",
        accent && accentBorder[accent],
        className
      )}
      {...props}
    />
  );
}
