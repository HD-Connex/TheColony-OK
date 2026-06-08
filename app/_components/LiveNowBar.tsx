"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLiveEventsClient } from "@/lib/live-events";
import { getCurrentLiveChannel } from "@/lib/live-247";

export default function LiveNowBar() {
  const [label, setLabel] = useState("24/7 ON AIR");
  const [href, setHref] = useState("/live");

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const [bundle, ch247] = await Promise.all([getLiveEventsClient(), getCurrentLiveChannel()]);
        if (!active) return;
        if (bundle.live[0]) {
          setLabel(`● LIVE · ${bundle.live[0].title}`);
          setHref("/live");
        } else if (ch247?.isLive) {
          setLabel(`● ${ch247.title}`);
          setHref("/live?247=1");
        } else if (bundle.upcoming[0]) {
          setLabel(`NEXT · ${bundle.upcoming[0].title}`);
          setHref("/live");
        }
      } catch {
        /* env missing during dev */
      }
    }

    refresh();
    const iv = setInterval(refresh, 60_000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, []);

  return (
    <Link href={href} className="live-now-bar" aria-label="Watch live">
      <span className="live-now-bar__dot" aria-hidden />
      {label}
    </Link>
  );
}