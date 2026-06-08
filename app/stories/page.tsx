import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import StoryCard from "../_components/StoryCard";
import { getArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Stories",
  description: "Investigative stories and long-form reporting from The Colony.",
};

export const revalidate = 120;

export default async function StoriesPage() {
  const articles = await getArticles({ limit: 24 }).catch(() => []);

  const todayLabel = new Date()
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();

  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Stories" }]} />
        <PageHeader
          eyebrow="▼ REPORTING"
          title="Stories"
          lede="Investigative reporting, analysis, and long-form journalism from The Colony."
        />

        <section className="section section--tight section--flush">
          <header className="section-header">
            <span className="section-header__number">N°01</span>
            <div className="section-header__group">
              <h2 className="section-title">Top Stories</h2>
              <span className="section-header__dateline">
                {todayLabel} · {String(articles.length).padStart(2, "0")} FILED
              </span>
            </div>
          </header>

          {articles.length === 0 ? (
            <p className="empty-state">No stories published yet.</p>
          ) : (
            <div className="grid-4">
              {articles.map((a) => (
                <StoryCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}