"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, springSoft } from "./motionPresets";

export default function MotionReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeUp}
      transition={{ ...springSoft, delay }}
    >
      {children}
    </motion.div>
  );
}