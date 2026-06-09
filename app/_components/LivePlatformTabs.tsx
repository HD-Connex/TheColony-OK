"use client";

import { useState } from "react";

const PLATFORMS = [
  { id: "youtube", label: "YouTube" },
  { id: "rumble", label: "Rumble" },
  { id: "website", label: "Website" },
] as const;

export default function LivePlatformTabs() {
  const [active, setActive] = useState<(typeof PLATFORMS)[number]["id"]>("youtube");

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
        >
          {platform.label}
        </button>
      ))}
    </div>
  );
}