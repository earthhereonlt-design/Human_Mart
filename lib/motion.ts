import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion language — one set of springs and variants so every
 * animation on the site feels like the same hand drew it.
 */

export const springSoft: Transition = { type: "spring", stiffness: 120, damping: 20 };
export const springSnappy: Transition = { type: "spring", stiffness: 380, damping: 28 };
export const springBouncy: Transition = { type: "spring", stiffness: 320, damping: 15 };

export const easeOutExpo: Transition["ease"] = [0.16, 1, 0.3, 1];

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: springSoft },
};

/** manga SFX slam — arrives oversized and skewed, settles hard */
export const slamIn: Variants = {
  hidden: { opacity: 0, y: 46, scale: 1.45, skewX: -14 },
  show: { opacity: 1, y: 0, scale: 1, skewX: 0, transition: springSnappy },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: springBouncy },
};

/** hinged entrances — panels swing in from one side like pages */
export const hingeLeft: Variants = {
  hidden: { opacity: 0, x: -36, rotateY: -8 },
  show: { opacity: 1, x: 0, rotateY: 0, transition: springSoft },
};
export const hingeRight: Variants = {
  hidden: { opacity: 0, x: 36, rotateY: 8 },
  show: { opacity: 1, x: 0, rotateY: 0, transition: springSoft },
};
