import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";
import StoryCard from "../../_components/StoryCard";
import NewsletterSignup from "../../_components/NewsletterSignup";
import FilterBar from "../../_components/FilterBar";
import { getTopic, getTopicArticles, type Topic } from "@/lib/topics";
import { getArticles, getRelatedArticles } from "@/lib/articles"; // Reuse getRelatedArticles in topics for more discovery breadth

export const revalidate = 120;

type Props = {
  params: Promise<{ topic: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: rawSlug } = await params;
  const topic = await getTopic(rawSlug).catch(() => null);
  const name = topic?.name ?? rawSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — Topics`,
    description: topic?.description ?? `Stories tagged ${name} from The Colony — Oklahoma investigations, rural beats, and local reporting.`,
  };
}

// Optional: static paths from current topics (for better static generation)
export async function generateStaticParams() {
  try {
    const topics = await getTopicArticles("economy", 1).then(() => []); // trigger import side, but use getTopics
    // Simpler: we don't hardcode; dynamic + revalidate is fine. Return empty for on-demand.
    return [];
  } catch {
    return [];
  }
}

export default async function TopicPage({ params }: Props) {
  const { topic: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const [topic, articles] = await Promise.all([
    getTopic(slug).catch(() => null as Topic | null),
    getTopicArticles(slug, 30).catch(() => [] as Awaited<ReturnType<typeof getTopicArticles>>),
  ]);

  const displayName = topic?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const count = topic?.count ?? articles.length;

  // Reuse getRelatedArticles in topics page (additional place) — data-driven from first article
  const relatedFromTopic = articles[0] ? await getRelatedArticles(articles[0].slug, 3).catch(() => []) : [];

  // Simple filter options for related browsing (reuse FilterBar for consistency with /stories)
  // Links to sibling demo topics + main topics index.
  const relatedFilters = [
    { key: "all-topics", label: "All Topics", href: "/topics" },
    { key: "economy", label: "Economy", href: "/topics/economy" },
    { key: "investigations", label: "Investigations", href: "/topics/investigations" },
    { key: "rural", label: "Rural", href: "/topics/rural" },
    { key: "culture", label: "Culture", href: "/topics/culture" },
  ];

  const activeKey = slug.toLowerCase();

  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Topics", href: "/topics" },
        { label: displayName },
      ]}
      eyebrow="▼ TOPIC BEAT"
      title={displayName}
      lede={
        topic?.description ??
        "Stories from The Colony matched to this topic. Content breadth from categories, counties, and tags in our seed + live data."
      }
      section={false}
      tone="paper"
    >
      {/* FilterBar reuse for quick hops between topics (focus on breadth) */}
      <FilterBar options={relatedFilters} activeKey={activeKey} />

      <div style={{ margin: "var(--space-4) 0 var(--space-6)" }}>
        <Link href="/topics" className="fine-print">← All topics</Link>
        <span className="fine-print" style={{ marginLeft: 12 }}>
          {count} {count === 1 ? "story" : "stories"} • also try <Link href="/stories">full investigations</Link> or <Link href="/counties">counties</Link>
        </span>
      </div>

      {/* Newsletter for continued engagement (consistent with other list pages) */}
      <NewsletterSignup
        variant="inline"
        source={`topic-${slug}`}
        title={`Subscribe for ${displayName} coverage`}
        copy="The Colony delivers topic-focused reporting plus county editions. No algorithms."
        compact
      />

      {articles.length === 0 ? (
        <div style={{ marginTop: "var(--space-8)" }}>
          <p className="empty-state">No stories matched this topic yet. Try a different one or check back as we publish.</p>
          <p style={{ marginTop: "var(--space-3)" }}>
            <Link href="/stories" className="btn btn--outline btn--sm">Browse all stories</Link>
          </p>
        </div>
      ) : (
        <div className="grid-3" style={{ marginTop: "var(--space-6)" }}>
          {articles.map((a) => (
            <StoryCard key={a.id} a={a} />
          ))}
        </div>
      )}

      <div style={{ marginTop: "var(--space-10)" }} className="fine-print">
        Topics are powered by direct tags (when the 0026 migration + joins are active) or by matching article categories and counties from our published content. This ensures immediate value with seed data.
      </div>

      {/* Related reuse via getRelatedArticles (topics breadth) */}
      {relatedFromTopic.length > 0 && (
        <div style={{ marginTop: "var(--space-4)" }} className="fine-print">
          Related: {relatedFromTopic.map((r: any, i: number) => (
            <span key={r.id}>{i > 0 ? " · " : ""}<Link href={`/stories/${r.slug}`}>{r.title}</Link></span>
          ))}
        </div>
      )}
    </InnerPageShell>
  );
}
