"use client";

import { motion, useReducedMotion } from "framer-motion";
import { riseIn, springSoft, hingeLeft, hingeRight } from "@/lib/motion";

/**
 * Scroll-into-view reveal — the site's default entrance.
 * Variants: "up" (rise), "3d" (panel slams up like a manga frame),
 * "3d-left"/"3d-right" (hinged on that side, like a page swinging open).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "3d" | "3d-left" | "3d-right";
}) {
  const reduce = useReducedMotion();

  const initial = reduce
    ? { opacity: 0 }
    : variant === "3d"
      ? { opacity: 0, y: 36, rotateX: 10, scale: 0.98 }
      : variant === "3d-left"
        ? { opacity: 0, x: -36, rotateY: -8 }
        : variant === "3d-right"
          ? { opacity: 0, x: 36, rotateY: 8 }
          : { opacity: 0, y: 26 };

  const settle =
    variant === "3d"
      ? { opacity: 1, y: 0, rotateX: 0, scale: 1 }
      : variant === "3d-left"
        ? { opacity: 1, x: 0, rotateY: 0 }
        : variant === "3d-right"
          ? { opacity: 1, x: 0, rotateY: 0 }
          : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={settle}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...springSoft, delay }}
      style={
        variant === "3d"
          ? { transformOrigin: "center bottom", transformPerspective: 1100 }
          : variant === "3d-left" || variant === "3d-right"
            ? { transformPerspective: 1100 }
            : undefined
      }
    >
      {children}
    </motion.div>
  );
}

/** Staggered list — children (StaggerItem) enter one after another. */
export function StaggerList({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.ol
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: delay } } }}
    >
      {children}
    </motion.ol>
  );
}

export function StaggerItem({
  children,
  className,
  variant = "up",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "up" | "left" | "right";
}) {
  const variants = variant === "left" ? hingeLeft : variant === "right" ? hingeRight : riseIn;
  return (
    <motion.li
      className={className}
      variants={variants}
      style={variant !== "up" ? { transformPerspective: 1100 } : undefined}
    >
      {children}
    </motion.li>
  );
}
