"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const PLATFORMS = [
  { id: "youtube", label: "YouTube" },
  { id: "rumble", label: "Rumble" },
  { id: "website", label: "Website" },
] as const;

export default function LivePlatformTabs() {
  const [active, setActive] = useState<(typeof PLATFORMS)[number]["id"]>("website");
  const reduced = useReducedMotion();

  return (
    <div className="tabs" role="tablist" aria-label="Streaming platform">
      {PLATFORMS.map((platform) => (
        <button
          key={platform.id}
          type="button"
          className="tabs__tab"
          role="tab"
          aria-selected={active === platform.id}
          onClick={() => setActive(platform.id)}
          style={{ position: "relative" }}
        >
          {platform.label}
          {active === platform.id && !reduced && (
            <motion.span
              layoutId="live-platform-tab"
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
        </button>
      ))}
    </div>
  );
}