"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Every route settles in like a freshly turned page. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, rotateY: -3 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 130, damping: 20 }}
      style={{ transformPerspective: 1200 }}
    >
      {children}
    </motion.div>
  );
}
