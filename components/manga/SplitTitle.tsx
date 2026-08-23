"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Headline letters rise in one by one — chunky display type loves this. */
export function SplitTitle({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, y: 26, rotate: 8 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ type: "spring", stiffness: 320, damping: 22, delay: delay + i * 0.022 }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}
