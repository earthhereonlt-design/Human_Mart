import { cn } from "@/lib/utils";
import { CreatureScene } from "@/components/creatures/CreatureScene";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { Mood } from "@/lib/types";

/** Manga-panel empty/loading/error states — each with the chibi in a mood. */
export function EmptyState({
  mood,
  title,
  body,
  caption,
  actionHref,
  actionLabel,
  className,
}: {
  mood: Mood;
  title: string;
  body: string;
  caption?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center py-10 text-center", className)}>
      <CreatureScene mood={mood} caption={caption} compact className="w-full max-w-60" />
      <h3 className="headline mt-8 text-2xl md:text-[28px]">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-mute">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-7 inline-flex h-11 items-center border-2 border-ink bg-clay px-6 font-display text-[12px] uppercase tracking-[0.1em] text-[#fbf8ee] shadow-[3px_3px_0_var(--color-ink)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/** A penciled, not-yet-inked panel — the artist is still drawing. */
export function SkeletonCard() {
  return (
    <div className="shimmer border-2 border-dashed border-ink/35 p-3">
      <div className="aspect-[3/4] w-full border-2 border-dashed border-ink/25" />
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-16 bg-ink/10" />
        <div className="h-3.5 w-4/5 bg-ink/10" />
        <div className="h-3 w-1/3 bg-ink/10" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div>
      <p className="jp mb-4 flex items-center gap-2 text-sm text-clay" aria-hidden="true">
        描き中…
        <Pencil className="m-wiggle h-4 w-4" strokeWidth={2} />
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
