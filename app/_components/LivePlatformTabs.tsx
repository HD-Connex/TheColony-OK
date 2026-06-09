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
          className="tabs__tab tabs__tab--relative"
          role="tab"
          aria-selected={active === platform.id}
          onClick={() => setActive(platform.id)}
        >
          {platform.label}
          {active === platform.id && !reduced && (
            <motion.span
              layoutId="live-platform-tab"
              className="live-tab-underline"
            />
          )}
        </button>
      ))}
    </div>
  );
}