export const springSnappy = { type: "spring" as const, stiffness: 320, damping: 22 };
export const springSoft = { type: "spring" as const, stiffness: 260, damping: 24 };

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};