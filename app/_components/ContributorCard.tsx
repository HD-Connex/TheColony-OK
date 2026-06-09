"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Contributor } from "@/lib/contributors";
import { tierBadgeClass, tierLabel } from "@/lib/contributor-tiers";
import { hostPhoto } from "@/lib/media-map";

function Meta({ c }: { c: Contributor }) {
  return (
    <div className="contrib__meta">
      {c.location && <span>{c.location}</span>}
      {c.website && (
        <a href={c.website} target="_blank" rel="noopener">
          {c.website.replace(/^https?:\/\//, "")}
        </a>
      )}
      {c.x_handle && (
        <a href={`https://x.com/${c.x_handle.replace("@", "")}`} target="_blank" rel="noopener">{c.x_handle}</a>
      )}
    </div>
  );
}

function Badge({ tier }: { tier: string }) {
  return <span className={`badge ${tierBadgeClass(tier)}`}>{tierLabel(tier)}</span>;
}
/** Renders a contributor at the layout appropriate to a tier:
 *  hero (headliner), featured, or compact (contributor).
 *  Uses next/image + framer-motion for crisp photos and subtle personality spotlight
 *  (whileHover micro-lift + photo scale, per ui-ux-pro-max-skill guidelines + Next.js image best practices).
 *  Improved fallback prefers new crisp host headshots when available. */
export default function ContributorCard({
  c,
  variant,
  teaser,
}: {
  c: Contributor;
  variant: "hero" | "featured" | "compact";
  teaser?: string; // e.g. "12 stories · 87 episodes · 3 videos" for mixed-work teaser in directory
}) {
  const href = `/contributors/${c.slug}`;
  const alt = `${c.name} — The Colony OK ${c.role ?? "journalist"}`;

  const photo = hostPhoto(c.slug, c.headshot_url, c.name);
  const isNewHostPhoto = photo.includes("/hosts/");

  const photoEl = (
    <Image
      src={photo}
      alt={alt}
      width={variant === "hero" ? 160 : variant === "featured" ? 96 : 56}
      height={variant === "hero" ? 160 : variant === "featured" ? 96 : 56}
      className="contrib__photo"
      style={variant === "hero" ? { width: 160, height: 160 } : variant === "featured" ? { width: 96, height: 96 } : { width: 56, height: 56 }}
      priority={variant === "hero"}
    />
  );

  const motionPhoto = (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ display: "inline-block", borderRadius: "var(--radius-sm)", overflow: "hidden" }}
    >
      {photoEl}
    </motion.div>
  );

  if (variant === "hero") {
    return (
      <motion.article
        className="contrib-hero"
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        {isNewHostPhoto ? motionPhoto : <div className="contrib-hero__photo">{photoEl}</div>}
        <div className="contrib-hero__body">
          <div className="contrib__meta"><Badge tier={c.tier} />{c.role && <span className="contrib__role">{c.role}</span>}</div>
          <h3 className="contrib__name"><Link href={href}>{c.name}</Link></h3>
          {c.bio && <p className="contrib__bio">{c.bio}</p>}
          <Meta c={c} />
          {teaser && <div className="contrib__meta" style={{ marginTop: "var(--space-1)", fontSize: "var(--text-xs)" }}>{teaser}</div>}
          <Link className="btn btn--outline btn--sm" href={href} style={{ alignSelf: "start" }}>Read their work →</Link>
        </div>
      </motion.article>
    );
  }

  if (variant === "featured") {
    return (
      <motion.article
        className="contrib-card--featured"
        whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {motionPhoto}
        <div className="contrib__body">
          <div className="contrib__meta"><Badge tier={c.tier} /></div>
          <h3 className="contrib__name"><Link href={href}>{c.name}</Link></h3>
          {c.role && <span className="contrib__role">{c.role}</span>}
          {c.bio && <p className="contrib__bio" style={{ fontSize: "var(--text-sm)" }}>{c.bio}</p>}
          <Meta c={c} />
          {teaser && <div className="contrib__meta" style={{ marginTop: "var(--space-1)", fontSize: "var(--text-xs)" }}>{teaser}</div>}
        </div>
      </motion.article>
    );
  }

  return (
    <Link className="contrib-card" href={href}>
      <motion.div
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        style={{ display: "inline-block", borderRadius: "var(--radius-sm)", overflow: "hidden" }}
      >
        {photoEl}
      </motion.div>
      <div>
        <h3 className="contrib__name">{c.name}</h3>
        {c.role && <span className="contrib__role">{c.role}</span>}
        {teaser && <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-muted)", marginTop: 2 }}>{teaser}</div>}
      </div>
    </Link>
  );
}
