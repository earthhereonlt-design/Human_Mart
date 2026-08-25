"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { slamIn, popIn } from "@/lib/motion";

type Phase = "cover" | "opening" | "firstpage" | "done";

/**
 * The volume opens, take two — a full manga cover: obi band, price
 * sticker, spine, layered page edges. It flips open with a light
 * sweep across the paper, lands on the 第一話 title page, which
 * then lifts away into the site. Once per session (pre-paint script
 * adds .intro-seen), skipped for reduced-motion users.
 */
export function IntroCurtain() {
  const [phase, setPhase] = useState<Phase>("cover");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (document.documentElement.classList.contains("intro-seen") || reduce) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setPhase("opening"), 1500);
    return () => clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    if (phase === "done") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className="intro-curtain fixed inset-0 z-[100] overflow-hidden"
      style={{ perspective: 1600 }}
      aria-hidden="true"
    >
      {/* first page — revealed beneath the flipping cover */}
      <motion.div
        className="absolute inset-0 bg-cream"
        initial={false}
        animate={
          phase === "firstpage"
            ? { opacity: 0, y: 44, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }
            : { opacity: 1, y: 0 }
        }
        onAnimationComplete={() => {
          if (phase === "firstpage") setPhase("done");
        }}
      >
        <div className="speedlines absolute inset-0 opacity-25" />
        <div className="halftone absolute inset-0" />
        <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
          <span className="jp text-[clamp(2.5rem,15vw,3.75rem)] font-bold tracking-[0.2em] text-ink md:text-7xl">第一話</span>
          <span className="h-0.5 w-24 bg-clay" aria-hidden="true" />
          <p className="hand text-xl text-ink-mute">the story begins…</p>
        </div>
      </motion.div>

      {/* the cover */}
      <motion.div
        className="absolute inset-0 origin-left bg-ivory"
        style={{ backfaceVisibility: "hidden" }}
        initial={false}
        animate={phase === "opening" || phase === "firstpage" ? { rotateY: -116 } : { rotateY: 0 }}
        transition={{ duration: 0.85, ease: [0.55, 0, 0.85, 0.35] }}
        onAnimationComplete={() => {
          if (phase === "opening") setPhase("firstpage");
        }}
      >
        <div className="speedlines absolute inset-0 opacity-30" />
        <div className="halftone absolute inset-0" />

        {/* spine */}
        <div className="absolute left-0 top-0 h-full w-5 bg-night/90" />
        <div className="absolute left-5 top-0 h-full w-0.5 bg-clay" />
        <span className="jp-v absolute left-[1px] top-1/2 hidden -translate-y-1/2 text-[9px] tracking-[0.4em] text-[#f2eee2]/70 sm:block">
          人間マート
        </span>

        {/* layered page edges */}
        <div className="absolute right-0 top-0 h-full w-1.5 translate-x-1.5 bg-parchment" />
        <div className="absolute bottom-0 right-0 h-full w-1 translate-x-3 bg-sand" />
        <div className="absolute bottom-0 right-0 h-1.5 w-full translate-y-1.5 bg-parchment" />

        {/* obi band */}
        <div className="absolute inset-x-0 top-[22%] -rotate-1 border-y-[3px] border-ink bg-clay py-2">
          <p className="text-center font-display text-[11px] uppercase tracking-[0.3em] text-[#fbf8ee]">
            完全無料 · 100% simulated · no refunds
          </p>
        </div>

        {/* price sticker */}
        <motion.div
          variants={popIn}
          className="absolute bottom-10 right-8 hidden -rotate-6 border-2 border-ink bg-gold px-3 py-1.5 shadow-[3px_3px_0_var(--color-ink)] sm:block"
        >
          <p className="hand text-lg leading-none text-ink">₹0</p>
          <p className="eyebrow mt-0.5 !text-[8px] !text-ink/70">free forever</p>
        </motion.div>

        {/* credit line */}
        <p className="absolute bottom-10 left-10 hidden text-[10px] uppercase tracking-[0.22em] text-ink-faint sm:block">
          story &amp; art — the market
        </p>

        <motion.div
          className="relative flex h-full flex-col items-center justify-center gap-5 px-6 text-center"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } } }}
        >
          <motion.span
            variants={popIn}
            className="jp m-breathe-slow grid h-24 w-24 -rotate-6 place-items-center border-[3px] border-ink bg-clay text-5xl text-[#fbf8ee] shadow-[5px_5px_0_var(--color-ink)]"
          >
            人
          </motion.span>
          <motion.h1 variants={slamIn} className="headline text-[clamp(2rem,9vw,3rem)] md:text-7xl">
            Human Mart
          </motion.h1>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className="flex items-center gap-3"
          >
            <span className="h-0.5 w-10 bg-clay" />
            <span className="eyebrow">The market opens</span>
            <span className="h-0.5 w-10 bg-clay" />
          </motion.div>
        </motion.div>

        {/* light sweeping across the paper as it turns */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-[70%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent)]"
          initial={false}
          animate={phase === "opening" ? { x: ["-80%", "160%"] } : { x: "-80%" }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
