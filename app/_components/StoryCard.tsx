"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Article } from "@/lib/articles";
import { tierBadgeClass, tierLabel } from "@/lib/contributor-tiers";
import { formatDate } from "@/lib/format";
/** Story card with a contributor byline. Featured/Headliner bylines show the
 *  crisp host headshot + location; Contributor shows a plain name + tier badge.
 *  Uses next/image + framer motion for spotlight pop on promoted personalities
 *  (guided by ui-ux-pro-max-skill Next.js image rules + micro-interaction timing). */
export default function StoryCard({ a, variant = "default" }: { a: Article; variant?: "default" | "lead" }) {
  const c = a.contributor;
  const promoted = c ? c.tier !== "contributor" : false;

  // Resolve best crisp photo (new generated hosts take priority for known personalities)
  const bylinePhoto = promoted
    ? (c?.headshot_url ||
        (c?.slug === "jake-merrick" || (c?.name || "").toLowerCase().includes("jake")
          ? "/assets/images/hosts/jake-merrick.jpg"
          : (c?.name || "").toLowerCase().includes("marcus")
            ? "/assets/images/hosts/marcus-webb.jpg"
            : (c?.name || "").toLowerCase().includes("rachel")
              ? "/assets/images/hosts/rachel-torres.jpg"
              : (c?.name || "").toLowerCase().includes("dan") || (c?.name || "").toLowerCase().includes("hollis")
                ? "/assets/images/hosts/dan-hollis.jpg"
                : "/assets/images/author-1.svg"))
    : null;

  return (
    <article className={`card card--article${variant === "lead" ? " card--lead" : ""}`}>
      {a.hero_url && (
        <div className="card__image">
          <img src={a.hero_url} alt={a.hero_alt ?? a.title} loading="lazy" />
        </div>
      )}
      <div className="card__body">
        <div className="card__meta">
          <span className="card__category">{a.category}</span>
          <span className="card__date">{formatDate(a.published_at)}</span>
          {a.member_only && <span className="badge badge--members">Members</span>}
        </div>
        <h3 className="card__title"><Link href={`/stories/${a.slug}`}>{a.title}</Link></h3>
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
