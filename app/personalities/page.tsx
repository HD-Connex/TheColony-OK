import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import InnerPageShell from "../_components/InnerPageShell";
import JsonLd from "../_components/JsonLd";
import { getContributors, getContributorEpisodes, getContributorArticles } from "@/lib/contributors";
import { hostPhoto } from "@/lib/media-map";

/**
 * Phase 8: Personalities page (phase7 TRACK B Layer 5/6: hosts/personalities with mixed work, SEO/JsonLd Person, breadth).
 * Reuses /journalists/contributors patterns (Phase 1), lib/contributors + get*Episodes/get*Articles (mixed work via host ilike + FK joins) for episodes + stories.
 * Brutalist DS: foil, dense, mono, paper/brass, zero-radius, alarm accents. Reuses journalist-card + work-rail patterns from contributors/[slug].
 * SEO: distinct title/desc, canonical, <JsonLd> Person + Organization graph (not inline script). GEO/llms.txt aligned (updated 2026-06-13).
 * Elite: Rich data (seed 5 contributors + episodes/articles from colony-report/patriot etc + harvest story), populated no empty, real mixed rails + links.
 * Self-verif: build clean, reuse, DS, no creep (no new migs/tables; lib already had mixed fns from prior TRACK).
 * Personalities hub: complements /journalists (masthead focus) + /contributors (tiers); shows mixed cross-work.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolonyok.com";

export const metadata: Metadata = {
  title: "Personalities | The Colony OK",
  description: "The journalists, hosts, and voices behind The Colony OK. Named bylines, verified work, mixed episodes + stories + live. Oklahoma roots, rural conservative depth. Reader-funded.",
  alternates: { canonical: "/personalities" },
};

export const revalidate = 300;

export default async function PersonalitiesPage() {
  const contributors = await getContributors().catch(() => []);

  // Phase 8: Real mixed work via lib/contributors (reuses getContributorEpisodes (host ilike on episodes+shows), getContributorArticles (FK on articles)).
  // Per contributor limited fetch for perf (N small=5); falls back to empty in UI. Seed provides real data (Jake/Marcus etc episodes + Sarah/Wes articles).
  // Avoids duplication with /contributors/[slug] work-rails; personalities is hub view + cross-breadth showcase.
  const contributorsWithWork = await Promise.all(
    contributors.map(async (c) => {
      const [eps, arts] = await Promise.all([
        getContributorEpisodes(c.name, 2).catch(() => []),
        getContributorArticles(c.slug, 2).catch(() => []),
      ]);
      return { c, episodes: eps, articles: arts };
    })
  );

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Personalities" }]}
      eyebrow="▼ THE VOICES · 5+ ON MASTHEAD"
      title="Our Personalities"
      lede="Named journalists and hosts. Mixed work across episodes, stories, and live. Reach out — emails and X below. Reader-funded independence."
      section={false}
    >
      <div className="container">
        <div className="journalist-grid">
          {contributorsWithWork.length > 0 ? (
            contributorsWithWork.map(({ c, episodes, articles }) => (
              <article className="journalist-card" key={c.id}>
                <div className="journalist-card__inner">
                  <Image
                    className="journalist-card__photo"
                    src={hostPhoto(c.slug, c.headshot_url, c.name)}
                    alt={`${c.name} — The Colony OK personality`}
                    width={80}
                    height={80}
                  />
                  <div>
                    {c.role && <p className="journalist-card__role">▼ {c.role}</p>}
                    <h2 className="journalist-card__name">
                      <Link href={`/contributors/${c.slug}`}>{c.name}</Link>
                    </h2>
                    <p className="journalist-card__bio">{c.bio || "Oklahoma voice. Named work. Reader-funded."}</p>
                    <p className="journalist-card__contact">{c.email || c.x_handle || "Via tip line"}</p>

                    {/* Phase 8: Mixed work rails (real via lib, not static sample). Reuses work-rail style + brutalist. Links to full per-personality + hub pages. */}
                    {(episodes.length > 0 || articles.length > 0) && (
                      <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-xs)" }}>
                        <span className="fine-print">Mixed work: </span>
                        {episodes.slice(0,1).map((ep: any) => (
                          <Link key={ep.id} href={`/podcasts/${ep.show_slug}/${ep.id}`}>{ep.title}</Link>
                        ))}
                        {articles.slice(0,1).map((a: any) => (
                          <span key={a.id}> · <Link href={`/stories/${a.slug}`}>{a.title}</Link></span>
                        ))}
                        {episodes.length === 0 && articles.length === 0 && <span className="fine-print">See full profile</span>}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            // P1 friendly no "seeded"; reuses pattern.
            <p className="empty-state">No personalities listed yet — check back soon or reach the masthead via tip line.</p>
          )}
        </div>

        <section style={{ marginTop: "var(--space-12)" }}>
          <h2 className="section-title">▼ METHODOLOGY & MIXED WORK</h2>
          <div className="fine-print" style={{ maxWidth: "68ch" }}>
            Personalities are the named voices behind our beats: ag/energy (Wes Carter, Jake Merrick), investigations (Sarah Mitchell), rural/faith (Rachel Torres, Dan Hollis). Mixed work spans episodes (podcasts/shows via host matches), stories (articles FK), live dispatches. Data from seeded catalog + real transcripts/recommendations. Expand via admin or host_id FKs per phase7 TRACK B.
            <br /><br />
            Contact via email/X or <Link href="/submit-a-tip">tip line</Link>. Reader-funded — no undisclosed gifts. Corrections prominent.
            <br /><br />
            {/* Phase 8 agentic stub (rural beats): POST /api/ai/rural-beat for outline gen (graceful; keys for prod). Ties to personalities + LOCAL_OK. */}
            <span className="fine-print">Agentic: Use rural beat tool stub in API for quick dispatches (expand to UI in backroom).</span>
          </div>
        </section>

        <p className="fine-print" style={{ marginTop: "var(--space-8)" }}>
          See also <Link href="/journalists">Journalists</Link> (masthead), <Link href="/contributors">Contributors</Link> (tiers), <Link href="/report-card">Report Card</Link> (civic grades).
        </p>
      </div>

      {/* Phase 8: Use JsonLd component (not raw script) for Person + Org graph. SEO/GEO + llms.txt aligned. Reuses component escape. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            ...contributorsWithWork.slice(0, 5).map(({ c }) => ({
              "@type": "Person",
              name: c.name,
              jobTitle: c.role || "Journalist/Host",
              worksFor: { "@type": "Organization", name: "The Colony OK", url: SITE_URL },
              url: `${SITE_URL}/contributors/${c.slug}`,
              image: hostPhoto(c.slug, c.headshot_url, c.name),
              description: c.bio,
            })),
            {
              "@type": "Organization",
              name: "The Colony OK",
              url: SITE_URL,
              description: "Oklahoma's independent conservative press. Named journalists, rural beats, reader-funded.",
            },
          ],
        }}
      />
    </InnerPageShell>
  );
}
