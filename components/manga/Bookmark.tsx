"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A red bookmark ribbon marking how far you've read — grows down the
 * right edge as you scroll, with a paper notch at its tip.
 */
export function Bookmark() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed right-0 top-0 z-[60] h-[34vh] w-[9px] origin-top border-l-2 border-ink bg-clay [clip-path:polygon(0_0,100%_0,100%_100%,50%_84%,0_100%)]"
      style={{ scaleY }}
    >
      <div className="halftone-ghost absolute inset-0 opacity-50" />
    </motion.div>
  );
}
