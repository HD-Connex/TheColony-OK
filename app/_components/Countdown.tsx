"use client";

import { useEffect, useState } from "react";

interface Props {
  target: string;       // ISO date string
  label?: string;       // e.g. "▼ COUNTDOWN" or "STARTS IN"
  variant?: "ink" | "alarm" | "block"; // styling hint
}

export default function Countdown({ target, label }: Props) {
  const [parts, setParts] = useState({ h: "--", m: "--", s: "--" });

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

  return (
    <div className="countdown">
      {label && <span className="countdown__label">{label}</span>}
      <div className="countdown__unit"><span className="countdown__value">{parts.h}</span><span className="countdown__unit-label">HRS</span></div>
      <div className="countdown__unit"><span className="countdown__value">{parts.m}</span><span className="countdown__unit-label">MIN</span></div>
      <div className="countdown__unit"><span className="countdown__value">{parts.s}</span><span className="countdown__unit-label">SEC</span></div>
    </div>
  );
}
