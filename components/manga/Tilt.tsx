"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * Cursor-tracked 3D tilt with a moving sheen — wraps cards and panels.
 * Springs make it feel weighted, not scripty. Pointer-events only;
 * touch and reduced-motion users get the flat panel.
 */
export function Tilt({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 260,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 260,
    damping: 22,
  });

  const sheenX = useTransform(px, [0, 1], ["18%", "82%"]);
  const sheenY = useTransform(py, [0, 1], ["18%", "82%"]);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgba(255,255,255,0.16), transparent 55%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div ref={ref} className={className} style={{ perspective: 900 }} onPointerMove={onMove} onPointerLeave={reset}>
      <motion.div
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {children}
        {!reduce && (
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: sheen }}
            aria-hidden="true"
          />
        )}
      </motion.div>
    </div>
  );
}
