import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Cart", "Address", "Payment"];

/** Checkout as manga pages — three numbered page-corner chips. */
export function PageStepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={`Checkout, step ${current + 1} of 3`}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-5 bg-ink/30" aria-hidden="true" />}
            <span
              className={cn(
                "relative inline-flex h-8 items-center gap-1.5 border-2 px-2.5 font-display text-[12px] uppercase tracking-wide",
                done && "border-ink bg-cream text-ink",
                active && "border-ink bg-ink text-[#fbf8ee] shadow-[3px_3px_0_var(--color-clay)]",
                !done && !active && "border-stone text-ink-faint"
              )}
              aria-current={active ? "step" : undefined}
            >
              {active && (
                <span
                  className="absolute -right-1.5 -top-1.5 h-3 w-3 border-2 border-ink bg-clay [clip-path:polygon(100%_0,0_0,100%_100%)]"
                  aria-hidden="true"
                />
              )}
              {done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
              <span className="hidden sm:inline">{label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
