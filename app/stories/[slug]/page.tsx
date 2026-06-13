import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "../../_components/Breadcrumbs";
import JsonLd from "../../_components/JsonLd";
import AuthorityBadge from "../../_components/AuthorityBadge";
import NewsletterSignup from "../../_components/NewsletterSignup"; // Teaser newsletter / The Briefing block in story sidebar (internal)
import ContinueRail from "../../_components/ContinueRail"; // Enhanced + reused for site-wide discovery (stories pages)
import { getArticleBySlug, getRelatedArticles } from "@/lib/articles";
import { formatDate } from "@/lib/format";
import { tierLocked } from "@/lib/tiers";
import { storyHero, hostPhoto, safeStockImage, STOCK } from "@/lib/media-map";
import { Paywall } from "../../_components/Paywall";
import PullQuote from "../../_components/PullQuote";
import EndMark from "../../_components/EndMark";
import ImpactSeal from "../../_components/ImpactSeal";
import { sanitizeHtml } from "@/lib/sanitize";
import { gateArticle } from "@/lib/content-access";

export const revalidate = 120;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolonyok.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function bodyParagraphs(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()];
}

function estimateReadTime(text: string | null | undefined): string {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} MIN READ`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch((e) => { console.error(e); return null; });
  if (!article) return { title: "Story Not Found" };

  const description = article.dek ?? article.description?.slice(0, 160) ?? undefined;

  return {
    title: article.title,
    description,
    alternates: { canonical: `/stories/${slug}` },
    openGraph: {
      title: article.title,
      description,
      images: article.hero_url ? [{ url: article.hero_url, alt: article.hero_alt ?? article.title }] : undefined,
      type: "article",
      publishedTime: article.published_at,
    },
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch((e) => { console.error('[stories] getArticleBySlug failed', slug, e); return null; });
  if (!article) notFound();

  const related = await getRelatedArticles(slug, 3).catch((e) => { console.error('[stories] getRelatedArticles failed', slug, e); return []; });
  const gated = await gateArticle(article).catch(() => ({ ...article, fullBody: true, body: article.description ?? null, locked: false }));
  const locked = (gated as any).locked ?? false;
  const rawParagraphs = bodyParagraphs((gated as any).body ?? article.description);
  const paragraphs = rawParagraphs.map((p) => sanitizeHtml(p));
  const author = (article.contributor?.name ?? "The Colony Staff").toUpperCase();
  const canonicalUrl = `${SITE_URL}/stories/${article.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.title,
          description: article.dek ?? article.description ?? undefined,
          image: article.hero_url ?? undefined,
          datePublished: article.published_at,
          author: {
            "@type": "Person",
            name: article.contributor?.name ?? "The Colony Staff",
          },
          // Defensive: some seeded data paths previously caused RSC 500s in prod prefetch; safe fallbacks here
          dateModified: article.updated_at ?? article.published_at,
          publisher: {
            "@type": "Organization",
            name: "The Colony OK",
            url: SITE_URL,
          },
          url: canonicalUrl,
          articleSection: article.category ?? undefined,
          isAccessibleForFree: !locked,
        }}
      />

      <main id="main">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Stories", href: "/stories" },
              { label: article.title },
            ]}
          />

          <div className="article-page">
            <article className="article">
              <header className="article__header">
                {(article.category || locked) && (
                  <p className="article__kicker">
                    {article.category && <span>▼ {article.category}</span>}
                    {locked && <span className="badge badge--members">Members</span>}
                  </p>
                )}
                <h1 className="article__title">{article.title}</h1>
                {article.dek && <p className="article__dek">{article.dek}</p>}
                {(article as any).impact && <ImpactSeal text={(article as any).impact} />}
                <div className="article__byline">
                  {(() => {
                    const avatarSrc = article.contributor
                      ? hostPhoto(article.contributor.slug, article.contributor.headshot_url, article.contributor.name)
                      : STOCK.hostDefault;
                    const avatarAlt = article.contributor?.name ?? "The Colony Staff";
                    return (
                      <Image
                        className="article__author-avatar"
                        src={avatarSrc}
                        alt={avatarAlt}
                        width={48}
                        height={48}
                      />
                    );
                  })()}
                  <div className="article__author-info">
                    {article.contributor ? (
                      <Link href={`/contributors/${article.contributor.slug}`} className="article__author-name">
                        {author}
                      </Link>
                    ) : (
                      <span className="article__author-name">{author}</span>
                    )}
                    <AuthorityBadge verified tier={article.contributor?.tier} />
                  </div>
                  <div className="article__date-read">
                    <time className="article__date" dateTime={article.published_at}>
                      {formatDate(article.published_at)}
                    </time>
                    <span className="article__read-time">{estimateReadTime(article.description)}</span>
                  </div>
                </div>
              </header>

              <figure className="article__hero-image">
                <Image
                  src={safeStockImage("story", article.slug, article.hero_url)}
                  alt={article.hero_alt ?? `${article.title} — full investigative report visual`}
                  width={1200}
                  height={630}
                  sizes="100vw"
                  priority
                />
                {(article.hero_alt || article.title) && (
                  <figcaption className="article__caption">{article.hero_alt ?? article.title}</figcaption>
                )}
              </figure>

              <div className="article__body article-body">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <EndMark />
              {locked && (
                <Paywall
                  perk="STORY_EXCLUSIVE"
                  episodeTitle={article.title}
                  returnUrl={`/stories/${article.slug}`}
                />
              )}

              <div className="article__share">
                <span className="article__share-label">Share</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonicalUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(canonicalUrl)}`}>
                  Email
                </a>
              </div>
            </article>

            <aside className="article-sidebar">
              <div className="article-sidebar__block">
                <h2 className="article-sidebar__title">Related Stories</h2>
                {related.length === 0 ? (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>No related stories yet.</p>
                ) : (
                  <ul className="related-list">
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link href={`/stories/${r.slug}`} className="related-link">
                          {r.category && <span className="related-kicker">{r.category}</span>}
                          <span className="related-title">{r.title}</span>
                          <time dateTime={r.published_at} className="related-date">{formatDate(r.published_at)}</time>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Newsletter teaser in individual story sidebar (sidebar variant, tasteful internal integration) */}
              <div className="article-sidebar__block" style={{ borderBottom: "none" }}>
                <NewsletterSignup
                  variant="sidebar"
                  source="story-sidebar"
                  title="The local briefing"
                  copy="County editions in your inbox."
                  compact
                />
              </div>
            </aside>
          </div>

          {/* Site-wide ContinueRail reuse for discovery breadth on story detail (episodes/progress + fallback) */}
          <ContinueRail compact />
        </div>
      </main>
    </>
  );
}
