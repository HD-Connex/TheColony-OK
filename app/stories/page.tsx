import type { Metadata } from "next";
import Image from "next/image";
import FilterBar from "../_components/FilterBar";
import InnerPageShell from "../_components/InnerPageShell";
import StoryCard from "../_components/StoryCard";
import { getArticles, type Article } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Stories",
  description: "Investigative stories and long-form reporting from The Colony.",
};

export const revalidate = 120;

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "politics", label: "Politics" },
  { key: "investigations", label: "Investigations" },
  { key: "culture", label: "Culture" },
  { key: "economy", label: "Economy" },
] as const;

function matchesCategory(article: Article, cat: string | undefined): boolean {
  if (!cat || cat === "all") return true;
  return (article.category ?? "").toLowerCase() === cat.toLowerCase();
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const activeKey = CATEGORIES.some((c) => c.key === cat) ? cat! : "all";

  const articles = await getArticles({ limit: 24 }).catch((e) => { console.error("Failed loading stories", e); return []; });
  const filtered = articles.filter((a) => matchesCategory(a, activeKey));

  const filterOptions = CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    href: c.key === "all" ? "/stories" : `/stories?cat=${c.key}`,
  }));

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Stories" }]}
      eyebrow="▼ INVESTIGATIONS"
      title="Top Stories"
      lede="Investigative reporting from Oklahoma. Politics, culture, the economy, and the stories the legacy press won't touch — funded by readers, not advertisers."
      section={false}
      tone="paper"
    >
      <FilterBar options={filterOptions} activeKey={activeKey} />

      {/* Aesthetic lead image for stories */}
      <div className="section-lead-image">
        <Image
          src="/assets/images/stories/oklahoma-budget-crisis.jpg"
          alt="Investigative reporting from Oklahoma"
          width={1200}
          height={400}
          className="img-aesthetic"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No stories published yet.</p>
      ) : (
        <div className="grid-3">
          {filtered.map((a) => (
            <StoryCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </InnerPageShell>
  );
}