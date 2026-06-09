"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export interface FilterOption {
  key: string;
  label: string;
  href: string;
}

export default function FilterBar({
  options,
  activeKey,
}: {
  options: FilterOption[];
  activeKey?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <nav className="filter-bar" aria-label="Filter">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          className={`filter-bar__chip${activeKey === o.key ? " filter-bar__chip--active" : ""}`}
          aria-pressed={activeKey === o.key}
        >
          {o.label}
          {activeKey === o.key && !reduced && (
            <motion.span
              layoutId="filter-active"
              className="filter-bar__indicator"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "var(--color-alarm)",
              }}
            />
          )}
        </Link>
      ))}
    </nav>
  );
}