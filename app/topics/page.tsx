import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import NewsletterSignup from "../_components/NewsletterSignup";
import { getTopics, type Topic } from "@/lib/topics";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse Oklahoma stories by topic — economy, investigations, rural counties, and more. The Colony's curated beats.",
};

export const revalidate = 120;

export default async function TopicsIndexPage() {
  const topics = await getTopics().catch(() => [] as Topic[]);

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Topics" }]}
      eyebrow="▼ CURATED BEATS"
      title="Explore by Topic"
      lede="Oklahoma reporting organized by the issues that matter: energy and economy, investigations, rural counties, culture, and statewide policy. Start here for breadth."
    >
      <div className="grid-2" style={{ marginTop: "var(--space-8)" }}>
        {topics.length === 0 && (
          <p className="empty-state">No topics yet. Seed data will populate categories and counties as topics.</p>
        )}
        {topics.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${encodeURIComponent(t.slug)}`}
            className="card"
            style={{ padding: "var(--space-4)", textDecoration: "none", display: "block" }}
          >
            <div className="card__body">
              <div className="card__meta">
                <span className="card__category">TOPIC</span>
                {typeof t.count === "number" && (
                  <span className="fine-print" style={{ marginLeft: "auto" }}>
                    {t.count} stor{t.count === 1 ? "y" : "ies"}
                  </span>
                )}
              </div>
              <h3 className="card__title" style={{ margin: "var(--space-2) 0 0" }}>{t.name}</h3>
              {t.description && (
                <p className="card__excerpt" style={{ marginTop: "var(--space-2)" }}>{t.description}</p>
              )}
              <div className="fine-print" style={{ marginTop: "var(--space-3)", color: "var(--color-alarm)" }}>
                Browse stories →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Newsletter block for breadth + discovery (reused pattern from /counties /stories) */}
      <div style={{ marginTop: "var(--space-12)" }}>
        <NewsletterSignup
          variant="plate"
          source="topics-page"
          title="Get the local briefing by topic"
          copy="Economy deep dives, county dispatches, and investigations delivered. Pick your counties too in My Feed as a member."
        />
      </div>

      <p className="fine-print" style={{ marginTop: "var(--space-8)" }}>
        Topics combine our categories, counties, and curated tags. Real tagged articles surface when the topics migration is applied.
        You can also browse <Link href="/counties">all counties</Link> or <Link href="/stories">all investigations</Link>.
      </p>
    </InnerPageShell>
  );
}
