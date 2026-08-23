"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "solid" | "outline" | "ghost" | "clay";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  solid:
    "btn-sheen bg-ink text-cream border-2 border-ink shadow-[3px_3px_0_var(--color-clay)] hover:shadow-[5px_5px_0_var(--color-clay)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  outline:
    "btn-sheen bg-transparent text-ink border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] hover:shadow-[5px_5px_0_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  ghost:
    "bg-transparent text-ink-mute border border-transparent hover:text-ink hover:bg-sand/50",
  clay:
    "btn-sheen bg-clay text-[#fbf8ee] border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-clay-deep hover:shadow-[5px_5px_0_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[11px]",
  md: "h-11 px-5 text-xs",
  lg: "h-[52px] px-7 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "solid", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-display uppercase tracking-[0.08em]",
        "transition-all duration-200 ease-out active:duration-75 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
        "rounded-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
      <span className="inline-flex items-center gap-2 transition-transform duration-100 active:scale-90">
        {children}
      </span>
    </button>
  )
);
Button.displayName = "Button";
