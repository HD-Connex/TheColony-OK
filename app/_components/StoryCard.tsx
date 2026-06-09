"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Article } from "@/lib/articles";
import { tierBadgeClass, tierLabel } from "@/lib/contributor-tiers";
import { formatDate } from "@/lib/format";
import { hostPhoto, storyHero } from "@/lib/media-map";

export default function StoryCard({ a, variant = "default" }: { a: Article; variant?: "default" | "lead" }) {
  const c = a.contributor;
  const promoted = c ? c.tier !== "contributor" : false;

  const bylinePhoto = promoted && c ? hostPhoto(c.slug, c.headshot_url, c.name) : null;

  return (
    <article className={`card card--article${variant === "lead" ? " card--lead" : ""}`}>
      <div className="card__image">
        <Image
          src={storyHero(a.slug, a.hero_url)}
          alt={a.hero_alt ?? `${a.title} — Oklahoma investigative journalism`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          loading="lazy"
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
                style={{ display: "inline-block", borderRadius: "999px", overflow: "hidden" }}
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
            <span className={`badge ${tierBadgeClass(c.tier)}`}>{tierLabel(c.tier)}</span>
            {promoted && c.location && <span>· {c.location}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
