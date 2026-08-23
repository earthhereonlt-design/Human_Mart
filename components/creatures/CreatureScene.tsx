import { cn } from "@/lib/utils";
import { Chibi } from "@/components/manga/Mascot";
import type { Mood } from "@/lib/types";

/**
 * Framed manga panel: screentone background, ink border, and the
 * shop chibi reacting to the mood. Used for hero moments, empty
 * states, and the success experience.
 */
export function CreatureScene({
  mood = "waiting",
  caption,
  className,
  canvasClassName,
  compact = false,
}: {
  mood?: Mood;
  caption?: string;
  className?: string;
  canvasClassName?: string;
  compact?: boolean;
}) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden border-[3px] border-ink bg-cream shadow-[5px_5px_0_var(--color-ink)]",
        compact ? "aspect-[4/3]" : "aspect-square",
        className
      )}
    >
      <div className="halftone absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-2 bg-ink" aria-hidden="true" />
      <div className={cn("relative flex h-full w-full items-end justify-center pb-1", canvasClassName)}>
        <Chibi mood={mood} className="h-[92%] w-auto" />
      </div>
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t-[3px] border-ink bg-cream px-4 py-2">
          <span className="hand text-sm leading-none text-ink-soft">{caption}</span>
          <span className="jp text-[11px] text-clay">見本</span>
        </figcaption>
      )}
    </figure>
  );
}
