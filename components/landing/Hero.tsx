"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Chibi, LuckyCat } from "@/components/manga/Mascot";
import { CountUp } from "@/components/manga/CountUp";
import { Magnetic } from "@/components/manga/Magnetic";
import { slamIn, springBouncy, springSoft } from "@/lib/motion";

const BUBBLE_LINE = "Welcome, customer-san! Every human is certified 100% off… emotionally.";

const TITLE_LINES: Array<Array<{ text: string; red?: boolean }>> = [
  [{ text: "People," }],
  [{ text: "with a" }, { text: "price tag.", red: true }],
];

/** the red phrase carries a drifting red→gold ink shimmer */

/** Cinematic volume-cover hero — title slams in, the bubble types, stats count up. */
export function Hero({ people, listings }: { people: number; listings: number }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const yLines = useTransform(scrollY, [0, 400], [0, 70]);
  const yMascots = useTransform(scrollY, [0, 400], [0, -34]);
  const fadeHero = useTransform(scrollY, [0, 320], [1, 0.35]);

  /* the shopkeeper types her greeting */
  const [typed, setTyped] = useState(reduce ? BUBBLE_LINE : "");
  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const start = setTimeout(() => {
      const tick = setInterval(() => {
        i += 1;
        setTyped(BUBBLE_LINE.slice(0, i));
        if (i >= BUBBLE_LINE.length) clearInterval(tick);
      }, 26);
    }, 1500);
    return () => {
      clearTimeout(start);
    };
  }, [reduce]);

  return (
    <section className="relative overflow-hidden border-b-[3px] border-ink bg-ivory">
      <motion.div className="speedlines absolute inset-0" style={reduce ? undefined : { y: yLines }} aria-hidden="true" />
      <div
        className="halftone absolute inset-x-0 bottom-0 h-28 [mask-image:linear-gradient(to_top,black,transparent)]"
        aria-hidden="true"
      />
      <span
        className="jp-v absolute left-2 top-1/2 hidden -translate-y-1/2 text-sm text-ink-faint lg:block"
        aria-hidden="true"
      >
        人間マートへようこそ
      </span>

      <motion.div
        className="container-page relative flex items-end justify-center gap-6 pb-20 pt-16 md:gap-12 md:pb-28 md:pt-24"
        style={reduce ? undefined : { opacity: fadeHero }}
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16 } } }}
      >
        {/* side mascot — the shopkeeper */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 70, scale: 0.7, rotate: -6 },
            show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { ...springBouncy, delay: 0.5 } },
          }}
          className="hidden shrink-0 md:block"
          style={reduce ? undefined : { y: yMascots }}
        >
          <Chibi mood="waiting" className="h-56 w-auto lg:h-72" />
        </motion.div>

        <div className="max-w-2xl text-center">
          {/* phones get the mascots too — a compact pair above the masthead */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 40, scale: 0.7 },
              show: { opacity: 1, y: 0, scale: 1, transition: { ...springBouncy, delay: 0.55 } },
            }}
            className="mb-1 flex items-end justify-center gap-5 md:hidden"
          >
            <Chibi mood="waiting" className="h-32 w-auto" />
            <LuckyCat className="h-24 w-auto self-center" />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: -14 }, show: { opacity: 1, y: 0, transition: springSoft } }}
            className="flex items-center justify-center gap-3"
          >
            <span className="jp text-sm text-ink-mute">第一話</span>
            <span className="h-0.5 w-10 bg-ink" aria-hidden="true" />
            <span className="eyebrow">The market opens</span>
          </motion.div>

          {/* title — each word slams in like SFX lettering */}
          <h1 className="headline mt-5 text-[clamp(2.9rem,8.5vw,6rem)] leading-[0.92]">
            {TITLE_LINES.map((line, li) => (
              <span key={li} className="block">
                {line.map((w) => (
                  <motion.span
                    key={w.text}
                    variants={reduce ? undefined : slamIn}
                    className={w.red ? "gradient-drift" : undefined}
                  >
                    {w.text}{" "}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.85, y: 16 }, show: { opacity: 1, scale: 1, y: 0, transition: springSoft } }}
            className="bubble mx-auto mt-8 max-w-md px-6 py-4 text-left"
          >
            <span className="hand text-lg leading-snug text-ink-soft">
              “{typed}
              {!reduce && typed.length < BUBBLE_LINE.length && (
                <span className="caret-blink ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-ink" aria-hidden="true" />
              )}
              {typed.length >= BUBBLE_LINE.length ? "”" : ""}
            </span>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: springSoft } }}
            className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Magnetic>
              <Link
                href="/explore"
                className="btn-sheen inline-flex h-[52px] items-center justify-center border-2 border-ink bg-clay px-9 font-display text-[15px] uppercase tracking-[0.08em] text-[#fbf8ee] shadow-[4px_4px_0_var(--color-ink)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                Read the market
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/list"
                className="btn-sheen inline-flex h-[52px] items-center justify-center border-2 border-ink bg-cream px-9 font-display text-[15px] uppercase tracking-[0.08em] text-ink shadow-[4px_4px_0_var(--color-ink)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-ink hover:text-[#fbf8ee] hover:shadow-[6px_6px_0_var(--color-clay)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                List a human
              </Link>
            </Magnetic>
          </motion.div>

          {people > 0 && (
            <motion.div
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: springSoft } }}
              className="mt-12 flex flex-wrap items-stretch justify-center gap-3"
            >
              {[
                { n: people, count: true, l: "humans in stock" },
                { n: listings, count: true, l: "offerings shelved" },
                { n: 0, count: false, l: "refunds on personality" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="halftone-fine border-2 border-ink bg-cream px-5 py-3 shadow-[3px_3px_0_var(--color-ink)]"
                >
                  <p className="font-display text-2xl tabular-nums">
                    {s.count ? <CountUp to={s.n} /> : s.n}
                  </p>
                  <p className="eyebrow mt-0.5 !text-[9px]">{s.l}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* scroll indicator — a thin ink bar, floating */}
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex" aria-hidden="true">
          <span className="eyebrow !text-[8px]">read on</span>
          <span className="m-float block h-8 w-px bg-ink/70" />
        </div>

        {/* side mascot — the shop cat */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 70, scale: 0.7, rotate: 6 },
            show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { ...springBouncy, delay: 0.7 } },
          }}
          className="hidden shrink-0 self-center md:block"
          style={reduce ? undefined : { y: yMascots }}
        >
          <LuckyCat className="h-48 w-auto lg:h-60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
