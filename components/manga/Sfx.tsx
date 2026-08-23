import { cn } from "@/lib/utils";

/**
 * Manga sound-effect burst — a red stamp that pops in rotated,
 * overshoots, and fades. Purely decorative (aria-hidden);
 * remount with a fresh `burstKey` to replay the animation.
 */
export function Sfx({
  text,
  burstKey,
  className,
}: {
  text: string;
  burstKey: number;
  className?: string;
}) {
  if (burstKey === 0) return null;
  return (
    <span
      key={burstKey}
      aria-hidden="true"
      className={cn(
        "sfx sfx-burst pointer-events-none absolute -top-3 right-3 z-20",
        "border-2 border-ink bg-clay px-2 py-0.5 font-display text-sm text-[#fbf8ee]",
        "shadow-[2px_2px_0_var(--color-ink)]",
        className
      )}
    >
      {text}
    </span>
  );
}
