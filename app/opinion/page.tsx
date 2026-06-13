import { getArticles, getRelatedArticles } from "@/lib/articles"; // Reuse getRelatedArticles here (opinion) + stories/news for discovery breadth
import StoryCard from "../_components/StoryCard";
import Link from "next/link";

export const revalidate = 120;

export default async function OpinionPage() {
  const articles = await getArticles({ limit: 12 }).catch(() => []);
  // Treat recent as opinion for demo; in prod filter by kind after migration
  const opinions = articles.filter((a: any) => a.category?.toLowerCase().includes('opinion') || (a as any).kind === 'opinion') || articles.slice(0, 8);

  // Reuse getRelatedArticles (more places) — pick first opinion for related rail
  const relatedOpinion = opinions[0] ? await getRelatedArticles(opinions[0].slug, 3).catch(() => []) : [];

  return (
    <main className="container">
      <h1>Opinion & Editorial</h1>
      <p className="fine-print">Faith-aligned, county-first commentary from The Colony desk.</p>
      <div className="grid-3">
        {opinions.map((a: any) => <StoryCard key={a.slug} a={a} />)}
      </div>

      {/* Related reuse on opinion page */}
      {relatedOpinion.length > 0 && (
        <section style={{ marginTop: "var(--space-6)" }}>
          <h3 className="section-title">Related Opinion &amp; Analysis</h3>
          <ul>
            {relatedOpinion.map((r: any) => (
              <li key={r.id}><Link href={`/stories/${r.slug}`}>{r.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/stories">All stories →</Link>
    </main>
  );
}
