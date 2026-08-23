"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  onChange,
  unit,
  max = 99,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  max?: number;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex h-11 items-center rounded-none border-2 border-ink bg-cream shadow-[3px_3px_0_var(--color-ink)]", className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="grid h-full w-10 place-items-center text-ink-mute transition-colors hover:bg-ink hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-mute"
      >
        <Minus size={14} strokeWidth={2} />
      </button>
      <span className="relative flex min-w-14 items-center justify-center overflow-hidden border-x-2 border-ink/15 px-1 text-sm font-medium tabular-nums" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="flex items-baseline"
          >
            {value}
            {unit && <span className="text-ink-faint"> {unit}{value > 1 ? "s" : ""}</span>}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid h-full w-10 place-items-center text-ink-mute transition-colors hover:bg-ink hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-mute"
      >
        <Plus size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
