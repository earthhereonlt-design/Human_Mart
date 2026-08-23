"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

/** A rupee figure that springs to its new value instead of snapping. */
export function AnimatedNumber({
  value,
  prefix = "₹",
  className,
}: {
  value: number;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (!ref.current || reduce) return;
    const from = Number(ref.current.dataset.v ?? value);
    const controls = animate(from, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (!ref.current) return;
        ref.current.dataset.v = String(v);
        ref.current.textContent = `${prefix}${Math.round(v).toLocaleString("en-IN")}`;
      },
    });
    return () => controls.stop();
  }, [value, prefix, reduce]);

  return (
    <span ref={ref} data-v={value} className={className}>
      {prefix}
      {value.toLocaleString("en-IN")}
    </span>
  );
}
