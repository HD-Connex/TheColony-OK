"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Article } from "@/lib/articles";
import { tierBadgeClass, contributorTierLabel } from "@/lib/contributor-tiers";
import { formatDate } from "@/lib/format";
import { hostPhoto, storyHero, safeStockImage, stockUnoptimized } from "@/lib/media-map";
import WatchlistButton from "./WatchlistButton"; // Reuse existing WatchlistButton (and /api/watchlist) on story/episode/clip cards when seriesId context available (discovery breadth)

export default function StoryCard({ a, variant = "default", watchSeriesId, priority = false }: { a: Article; variant?: "default" | "lead"; watchSeriesId?: string; priority?: boolean }) {
  const c = a.contributor;
  const promoted = c ? c.tier !== "contributor" : false;

  const bylinePhoto = promoted && c ? hostPhoto(c.slug, c.headshot_url, c.name) : null;

  // Phase 7 LCP polish: lead variant (topLead on home) gets optimized larger sizes (reflects .grid-feature 2fr ~60%+ desktop) + explicit fetchPriority high.
  // Reuses existing priority prop (already passed for topLead in page.tsx). Next Image priority + fetchPriority both ensure high prio + eager + head preload for main LCP hero img.
  // Non-lead remain lazy. Sizes tuned for LCP image download perf (avoids overfetch on mobile).
  // NOTE (elite LCP): Code opts (priority/fetchPriority/sizes/preload) maxed. Primary remaining is image bytes (local assets + pexels stock). For prod: real compressed photos (<150-200KB target, avif/webp via next), smaller variants, or admin uploads via media-map. See PERF_AUDIT.md + docs/MOBILE_TWA_PWA_STRATEGY.md + PHASE5. Current seed stock sufficient for demo but real images win CWV LCP.
  const leadSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px";
  const defaultSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
  const imageSizes = variant === "lead" ? leadSizes : defaultSizes;

  return (
    <article className={`card card--article${variant === "lead" ? " card--lead" : ""}`}>
      <div className="card__image">
        <Image
          src={safeStockImage("story", a.slug, a.hero_url)}
          alt={a.hero_alt ?? `${a.title} — Oklahoma investigative journalism`}
          fill
          sizes={imageSizes}
          className="img-cover develop"
          style={{ objectFit: "cover" }}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          unoptimized={stockUnoptimized(safeStockImage("story", a.slug, a.hero_url))}
        />
      </div>
      <div className="card__body">
        <div className="card__meta">
          <span className="card__category">{a.category ?? "News"}</span>
          <span className="card__date">{formatDate(a.published_at)}</span>
          {a.member_only && <span className="badge badge--members">Members</span>}
        </div>
        <h3 className="card__title">
          <Link href={`/stories/${a.slug}`}>{a.title}</Link>
        </h3>
        {a.dek && <p className="card__excerpt">{a.dek}</p>}
        {c && (
          <div className="story-byline">
            {promoted && bylinePhoto && (
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="photo-frame"
              >
                <Image
                  src={bylinePhoto}
                  alt={c.name}
                  width={28}
                  height={28}
                  style={{ width: 28, height: 28, objectFit: "cover" }}
                />
              </motion.div>
            )}
            <Link href={`/contributors/${c.slug}`}>{c.name}</Link>
            <span className={`badge ${tierBadgeClass(c.tier)}`}>{contributorTierLabel(c.tier)}</span>
            {promoted && c.location && <span>· {c.location}</span>}
          </div>
        )}
        {/* Optional WatchlistButton reuse inside StoryCard (episodes/clips/stories cards) — only renders if watchSeriesId passed from parent context (e.g. story about a show) */}
        {watchSeriesId && (
          <div style={{ marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
            <WatchlistButton seriesId={watchSeriesId} className="btn btn--sm btn--outline" />
          </div>
        )}
      </div>
    </article>
  );
}
