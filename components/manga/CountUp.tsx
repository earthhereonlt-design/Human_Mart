"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/** Counts from 0 to `to` when scrolled into view. */
export function CountUp({
  to,
  className,
  duration = 1.3,
}: {
  to: number;
  className?: string;
  duration?: number;
}) {
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(numRef, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || !numRef.current) return;
    if (reduce) {
      numRef.current.textContent = String(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span className={className}>
      <span ref={numRef}>0</span>
    </span>
  );
}
