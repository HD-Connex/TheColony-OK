import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import { getArticles } from "@/lib/articles";
import { formatDate } from "@/lib/format";
import { tierLocked } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Daily News",
  description: "The day's headlines from The Colony.",
};

export const revalidate = 120;

export default async function NewsPage() {
  let items = await getArticles({ limit: 30 }).catch(() => []);

  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "News" }]} />
        <PageHeader
          eyebrow="▼ DAILY"
          title="The News Feed"
          lede="Headlines and stories from The Colony — updated throughout the day."
        />

        {items.length === 0 ? (
          <p className="empty-state">No headlines yet.</p>
        ) : (
          <ol className="news-list">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={`/stories/${a.slug}`} className="news-item">
                  <time className="news-item__time" dateTime={a.published_at}>
                    {formatDate(a.published_at)}
                  </time>
                  <div>
                    <div style={{ display: "flex", gap: ".5rem", marginBottom: ".25rem" }}>
                      {a.category && <span className="badge">{a.category}</span>}
                      {tierLocked(a.tier_required) && <span className="badge badge--members">Members</span>}
                    </div>
                    <h2 className="news-item__title">{a.title}</h2>
                    {a.description && <p className="news-item__desc">{a.description}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}