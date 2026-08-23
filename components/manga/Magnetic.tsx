"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/**
 * Magnetic hover — the element leans a few pixels toward the cursor
 * and springs back on leave. Subtle on purpose; that's the premium bit.
 */
export function Magnetic({
  children,
  className,
  strength = 0.22,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.3 });

  const clamp = (v: number) => Math.max(-max, Math.min(max, v));

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? undefined : { x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType === "touch" || reduce) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength));
        y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
