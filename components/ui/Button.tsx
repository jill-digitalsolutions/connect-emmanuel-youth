import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "default" | "ghost" | "gradient" | "amber" | "coral" | "moss" | "plum";
type Size = "default" | "sm";

const variantClasses: Record<Variant, string> = {
  default: "bg-ink text-white hover:brightness-110",
  ghost: "bg-transparent text-text border border-line hover:bg-page",
  gradient: "bg-gradient-to-r from-accent-from to-accent-to text-white hover:brightness-105",
  amber: "bg-amber text-[#3B2504] hover:brightness-105",
  coral: "bg-coral text-white hover:brightness-105",
  moss: "bg-moss text-white hover:brightness-105",
  plum: "bg-plum text-white hover:brightness-105",
};

const sizeClasses: Record<Size, string> = {
  default: "px-4 py-2.5 text-sm rounded-[10px]",
  sm: "px-3 py-1.5 text-xs rounded-lg",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ className, variant = "default", size = "default", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-bold transition disabled:cursor-default disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
