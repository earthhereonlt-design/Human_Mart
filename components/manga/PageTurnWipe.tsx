"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

const SFX = ["パラッ", "バサッ", "めくり"];

/** reading order — pages turn forward toward higher chapters, back toward lower */
const CHAPTER: Record<string, number> = {
  "/": 1,
  "/explore": 2,
  "/cart": 3,
  "/checkout": 4,
  "/checkout/payment": 5,
  "/checkout/success": 6,
  "/login": 7,
  "/register": 7,
  "/account": 8,
  "/list": 9,
};
const orderOf = (p: string) =>
  CHAPTER[p] ?? (p.startsWith("/listing") || p.startsWith("/person") ? 10 : 99);

/**
 * Page-turn wipe, take three — a paper page with a curl on its leading
 * edge sweeps in the direction you're reading (forward chapters turn
 * left-to-right, back turns right-to-left), casting a soft shadow and
 * dimming the page beneath as it passes. Trailing sheet + rotating SFX.
 */
export function PageTurnWipe() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const firstRender = useRef(true);
  const prevPath = useRef(pathname);
  const [turn, setTurn] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (reduce) return;
    const nextDir = orderOf(pathname) >= orderOf(prevPath.current) ? 1 : -1;
    prevPath.current = pathname;
    setDir(nextDir);
    setTurn((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (turn === 0) return null;

  const sweep = (delay: number) => ({
    initial: { x: dir > 0 ? "-104%" : "104%", rotateY: dir > 0 ? 22 : -22 },
    animate: {
      x: dir > 0 ? ["-104%", "0%", "0%", "104%"] : ["104%", "0%", "0%", "-104%"],
      rotateY: dir > 0 ? [22, 0, 0, -18] : [-22, 0, 0, 18],
    },
    transition: { duration: 0.68, times: [0, 0.4, 0.5, 1], ease: "easeInOut" as const, delay },
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" style={{ perspective: 1500 }} aria-hidden="true">
      {/* the page beneath dims as the sheet passes over it — depth */}
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.16, 0.16, 0] }}
        transition={{ duration: 0.68, times: [0, 0.4, 0.5, 1], ease: "easeInOut" }}
      />

      {/* trailing sheet — page-stack thickness */}
      <motion.div
        key={`trail-${turn}`}
        className="halftone absolute inset-0 origin-left border-y-[3px] border-ink bg-parchment opacity-60"
        {...sweep(0.06)}
      />

      {/* the page */}
      <motion.div
        key={`page-${turn}`}
        className="absolute inset-0 origin-left bg-cream shadow-[0_18px_60px_rgba(22,19,14,0.35)]"
        {...sweep(0)}
        onAnimationComplete={() => setTurn(0)}
      >
        <div className="halftone absolute inset-0 opacity-70" />
        {/* binding + curl on the leading edge */}
        <div className="absolute right-0 top-0 h-full w-2 bg-clay" />
        <div className="absolute inset-y-0 right-[8%] w-[24%] bg-[linear-gradient(90deg,transparent,rgba(22,19,14,0.15),transparent)]" />
        {/* dog-ear on the leading corner */}
        <div className="absolute bottom-0 right-0 h-16 w-16 border-l-[3px] border-t-[3px] border-ink bg-parchment [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
        <div className="flex h-full items-center justify-center">
          <motion.span
            className="jp -rotate-6 text-3xl font-bold text-clay drop-shadow-[2px_2px_0_var(--color-cream)]"
            animate={{ scale: [0.85, 1.05, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.68, times: [0, 0.25, 0.6, 1] }}
          >
            {SFX[(turn - 1) % SFX.length]}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}
