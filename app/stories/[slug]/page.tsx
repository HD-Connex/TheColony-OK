import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumbs from "../../_components/Breadcrumbs";
import JsonLd from "../../_components/JsonLd";
import { getArticleBySlug, getRelatedArticles } from "@/lib/articles";
import { formatDate } from "@/lib/format";
import { tierLocked } from "@/lib/tiers";

export const revalidate = 120;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";

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
  const article = await getArticleBySlug(slug).catch(() => null);
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
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) notFound();

  const related = await getRelatedArticles(slug, 3).catch(() => []);
  const locked = tierLocked(article.tier_required);
  const paragraphs = bodyParagraphs(article.description);
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
                <div className="article__byline">
                  {article.contributor?.headshot_url ? (
                    <img
                      className="article__author-avatar"
                      src={article.contributor.headshot_url}
                      alt={article.contributor.name}
                    />
                  ) : (
                    <div
                      className="article__author-avatar"
                      style={{ background: "var(--color-border)" }}
                      aria-hidden
                    />
                  )}
                  <div className="article__author-info">
                    {article.contributor ? (
                      <Link href={`/contributors/${article.contributor.slug}`} className="article__author-name">
                        {author}
                      </Link>
                    ) : (
                      <span className="article__author-name">{author}</span>
                    )}
                  </div>
                  <div className="article__date-read">
                    <time className="article__date" dateTime={article.published_at}>
                      {formatDate(article.published_at)}
                    </time>
                    <span className="article__read-time">{estimateReadTime(article.description)}</span>
                  </div>
                </div>
              </header>

              {article.hero_url && (
                <figure className="article__hero-image">
                  <img src={article.hero_url} alt={article.hero_alt ?? article.title} />
                  {article.hero_alt && <figcaption className="article__caption">{article.hero_alt}</figcaption>}
                </figure>
              )}

              <div className={locked ? "paywall" : undefined}>
                <div className="article__body">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {locked && (
                  <>
                    <div className="paywall__fade" aria-hidden />
                    <div className="paywall__gate">
                      <h2 className="paywall__gate-title">Members Only</h2>
                      <p className="paywall__gate-copy">
                        This story is reserved for Colony members. Join for full access to investigative reporting —
                        starting at $4.99/mo.
                      </p>
                      <Link href="/pricing" className="btn btn--primary">
                        View Membership
                      </Link>
                    </div>
                  </>
                )}
              </div>

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
                  <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", listStyle: "none" }}>
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link href={`/stories/${r.slug}`} style={{ display: "block" }}>
                          {r.category && (
                            <span
                              style={{
                                display: "block",
                                fontFamily: "var(--font-mono)",
                                fontSize: "var(--text-xs)",
                                letterSpacing: "var(--track-wide)",
                                textTransform: "uppercase",
                                color: "var(--color-alarm)",
                                marginBottom: "var(--space-1)",
                              }}
                            >
                              {r.category}
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: "var(--weight-bold)",
                              lineHeight: "var(--leading-snug)",
                              color: "var(--color-paper)",
                            }}
                          >
                            {r.title}
                          </span>
                          <time
                            dateTime={r.published_at}
                            style={{
                              display: "block",
                              marginTop: "var(--space-1)",
                              fontFamily: "var(--font-mono)",
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {formatDate(r.published_at)}
                          </time>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}