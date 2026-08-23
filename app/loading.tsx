/** Root fallback — a little book flipping through its pages. */
export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-28 w-40 [perspective:900px]" aria-hidden="true">
          {/* the open book */}
          <div className="absolute inset-0 border-[3px] border-ink bg-cream shadow-[5px_5px_0_var(--color-ink)]">
            <div className="halftone absolute inset-0 opacity-60" />
            <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-ink/25" />
            <div className="absolute left-2 top-1/2 h-10 w-6 -translate-y-1/2 border-2 border-dashed border-ink/25" />
            <div className="absolute right-2 top-1/2 h-10 w-6 -translate-y-1/2 border-2 border-dashed border-ink/25" />
          </div>
          {/* the page forever turning */}
          <div className="book-flip absolute inset-y-[3px] left-1/2 w-[calc(50%-3px)] origin-left border-[3px] border-ink bg-parchment">
            <div className="halftone absolute inset-0 opacity-50" />
          </div>
        </div>
        <p className="jp flex items-center gap-2 text-sm text-clay" aria-hidden="true">
          開巻中…
        </p>
        <p className="hand text-lg text-ink-mute">opening the market…</p>
      </div>
    </div>
  );
}
