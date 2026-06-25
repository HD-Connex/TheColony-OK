"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  target: string;
  label?: string;
  variant?: "ink" | "alarm" | "block";
}

const Unit = ({ value, unit, reduced }: { value: string; unit: string; reduced: boolean | null }) => (
  <div className="countdown__unit">
    <motion.span
      className="countdown__value"
      key={value + unit}
      initial={reduced ? false : { scale: 1.08, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {value}
    </motion.span>
    <span className="countdown__unit-label">{unit}</span>
  </div>
);

export default function Countdown({ target, label, variant = "ink" }: Props) {
  const [parts, setParts] = useState({ h: "--", m: "--", s: "--" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    if (!Number.isFinite(targetMs)) return;

    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setParts({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const variantClass =
    variant === "alarm" ? "countdown--alarm" : variant === "block" ? "countdown--block" : "countdown--ink";

  return (
    <div className={`countdown ${variantClass}`}>
      {label && <span className="countdown__label">{label}</span>}
      <Unit value={parts.h} unit="HRS" reduced={reduced} />
      <Unit value={parts.m} unit="MIN" reduced={reduced} />
      <Unit value={parts.s} unit="SEC" reduced={reduced} />
    </div>
  );
}