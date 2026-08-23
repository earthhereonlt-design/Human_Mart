"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

export function PersonUrl({ path }: { path: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 border border-sand bg-cream px-3.5 py-2.5 text-xs text-ink-mute">
        <Link2 size={13} strokeWidth={1.5} />
        <span className="select-all">{origin}{path}</span>
      </span>
      <button
        type="button"
        onClick={async () => {
          const url = `${window.location.origin}${path}`;
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            // clipboard blocked — the URL text above is selectable either way
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        className="inline-flex items-center gap-2 border border-sand bg-cream px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute transition-colors hover:border-stone hover:text-ink"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
