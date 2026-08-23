"use client";

import { motion, useScroll, useSpring, useVelocity, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const ITEMS = [
  "Can build your backend — ₹999 / hour",
  "ドドド",
  "Makes excellent chai — ₹50 / cup",
  "Fixes that one drawer — ₹300 / visit",
  "ゴゴゴ",
  "Teaches guitar, patiently — ₹799 / session",
  "Writes wedding speeches — ₹1,500 / speech",
  "タンッ",
  "Attends weddings as a plus-one — ₹2,000 / event",
  "Good at cleaning — ₹400 / hour",
  "ザワザワ",
  "Explains cricket stats — ₹200 / consultation",
  "Will laugh at your jokes — free / first laugh",
];

/** A manga SFX is any katakana entry — rendered brush-red between listings. */
const isSfx = (s: string) => !/[a-zA-Z₹]/.test(s);

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];

  /* the strip leans into your scroll velocity, like a page caught in wind */
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { stiffness: 180, damping: 45 });
  const skew = useTransform(smooth, [-2500, 0, 2500], [-5, 0, 5]);

  return (
    <section aria-hidden="true" className="marquee-wrap overflow-hidden border-y-[3px] border-ink bg-night py-3.5">
      <div className="marquee-mask">
        <motion.div style={{ skewX: skew }}>
          <div className="marquee-track flex w-max items-center gap-9 pr-9">
            {row.map((item, i) => (
              <span key={i} className="flex items-center gap-9 whitespace-nowrap">
                {isSfx(item) ? (
                  <span className="jp m-wiggle inline-block text-lg font-bold text-clay">{item}</span>
                ) : (
                  <span className="font-display text-[12px] uppercase tracking-[0.14em] text-[#f2eee2]/75">
                    {item}
                  </span>
                )}
                <span
                  className={cn("text-[9px]", i % 4 === 3 ? "text-gold" : "text-clay")}
                  aria-hidden="true"
                >
                  ◆
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
