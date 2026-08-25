"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parts(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/** Live D/H/M/S countdown — manga stat boxes, ticking every second. */
export function Countdown({ endsAt, onDone }: { endsAt: string; onDone?: () => void }) {
  const router = useRouter();
  const [left, setLeft] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const next = new Date(endsAt).getTime() - Date.now();
      setLeft(next);
      if (next <= 0) {
        clearInterval(t);
        onDone?.();
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [endsAt, onDone, router]);

  const p = parts(left);
  const cells = [
    { v: p.d, l: "days" },
    { v: p.h, l: "hours" },
    { v: p.m, l: "min" },
    { v: p.s, l: "sec" },
  ];

  return (
    <div className="flex items-stretch justify-center gap-1.5 sm:gap-2.5">
      {cells.map((c, i) => (
        <div key={c.l} className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="halftone-fine w-[52px] border-2 border-ink bg-cream px-1 py-2 text-center shadow-[3px_3px_0_var(--color-ink)] sm:w-[68px] sm:px-2 sm:py-2.5 md:w-20">
            <p className="font-display text-2xl tabular-nums sm:text-3xl md:text-4xl">
              {String(c.v).padStart(2, "0")}
            </p>
            <p className="eyebrow mt-0.5 !text-[8px]">{c.l}</p>
          </div>
          {i < cells.length - 1 && (
            <span className="font-display text-lg text-clay sm:text-2xl" aria-hidden="true">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
