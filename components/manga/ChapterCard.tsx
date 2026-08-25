import { cn } from "@/lib/utils";
import { SplitTitle } from "@/components/manga/SplitTitle";

/** chapter kicker — pixel label on an ink chip with a red hard shadow */
function Kicker({ jp }: { jp: string }) {
  return (
    <span className="jp inline-block -rotate-1 border-2 border-ink bg-ink px-3 py-1 text-sm text-cream shadow-[3px_3px_0_var(--color-clay)]">
      {jp}
    </span>
  );
}

/**
 * Chapter title card — every page opens like a manga chapter.
 * CSS-only page-turn entrance, so it stays a server component.
 */
export function ChapterCard({
  jp,
  title,
  sub,
  className,
}: {
  jp: string; // e.g. 第2話, 幕間, 最終話, 特別編, 読切
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("page-turn", className)}>
      <div className="flex items-center gap-3">
        <Kicker jp={jp} />
        <span className="rule-draw h-0.5 flex-1 bg-ink/25" aria-hidden="true" />
      </div>
      <h1 className="headline mt-4 text-display">
        <SplitTitle text={title} />
      </h1>
      {sub && <p className="hand mt-2 text-lg text-ink-mute">{sub}</p>}
    </div>
  );
}

/** Lighter inline chapter mark for detail pages that already have their own headline. */
export function ChapterMark({ jp, className }: { jp: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Kicker jp={jp} />
      <span className="rule-draw h-0.5 flex-1 bg-ink/25" aria-hidden="true" />
    </div>
  );
}
