import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";
import SectionBlock from "../../_components/SectionBlock";
import JsonLd from "../../_components/JsonLd";
import {
  getContributorBySlug,
  getContributorArticles,
  getContributorEpisodes,
  getContributorVideos,
  getContributorLives,
  getActiveContributorSlugs,
} from "@/lib/contributors";
import { tierBadgeClass, tierLabel } from "@/lib/contributor-tiers";
import { formatDate, formatDurationLabel } from "@/lib/format";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function photoFor(slug: string, headshot: string | null, name: string): string {
  if (headshot) return headshot;
  const lower = `${slug} ${name}`.toLowerCase();
  if (lower.includes("marcus") || lower.includes("webb")) return "/assets/images/hosts/marcus-webb.jpg";
  if (lower.includes("rachel") || lower.includes("torres")) return "/assets/images/hosts/rachel-torres.jpg";
  if (lower.includes("dan") || lower.includes("hollis") || lower.includes("pastor"))
    return "/assets/images/hosts/dan-hollis.jpg";
  if (lower.includes("jake") || lower.includes("merrick")) return "/assets/images/hosts/jake-merrick.jpg";
  return "/assets/images/author-1.svg";
}

export async function generateStaticParams() {
  const slugs = await getActiveContributorSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = await getContributorBySlug(slug).catch(() => null);
  if (!c) return { title: "Contributor Not Found" };
  return {
    title: c.name,
    description: c.bio ?? `${c.name} — journalist and host at The Colony OK.`,
    alternates: { canonical: `/contributors/${slug}` },
    openGraph: {
      title: `${c.name} | The Colony OK`,
      description: c.bio ?? undefined,
      images: c.headshot_url ? [{ url: c.headshot_url, alt: c.name }] : undefined,
    },
  };
}

export const revalidate = 300;

export default async function ContributorPage({ params }: PageProps) {
  const { slug } = await params;
  const contributor = await getContributorBySlug(slug).catch(() => null);
  if (!contributor) notFound();

  const [articles, episodes, videos, lives] = await Promise.all([
    getContributorArticles(slug).catch(() => []),
    getContributorEpisodes(contributor.name).catch(() => []),
    getContributorVideos(contributor.name).catch(() => []),
    getContributorLives(contributor.name).catch(() => []),
  ]);

  const photo = photoFor(contributor.slug, contributor.headshot_url, contributor.name);
  const canonicalUrl = `${SITE_URL}/contributors/${contributor.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: contributor.name,
          url: canonicalUrl,
          jobTitle: contributor.role ?? undefined,
          description: contributor.bio ?? undefined,
          image: contributor.headshot_url ?? undefined,
        }}
      />

      <InnerPageShell
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Journalists", href: "/journalists" },
          { label: contributor.name },
        ]}
        eyebrow={`▼ MASTHEAD · ${tierLabel(contributor.tier).toUpperCase()}`}
        title={contributor.name}
        section={false}
      >
        <div className="contrib-profile">
          <Image
            className="contrib-profile__photo"
            src={photo}
            alt={contributor.name}
            width={160}
            height={160}
            priority
          />
          <div>
            <span className={`badge ${tierBadgeClass(contributor.tier)}`}>{tierLabel(contributor.tier)}</span>
            {contributor.role && <p className="contrib-profile__role">{contributor.role}</p>}
            {contributor.bio && <p className="contrib-profile__bio">{contributor.bio}</p>}
            <div className="contrib-profile__meta">
              {contributor.location && <span>{contributor.location}</span>}
              {contributor.email && (
                <a href={`mailto:${contributor.email}`}>{contributor.email}</a>
              )}
              {contributor.x_handle && (
                <a
                  href={`https://x.com/${contributor.x_handle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contributor.x_handle.startsWith("@") ? contributor.x_handle : `@${contributor.x_handle}`}
                </a>
              )}
              {contributor.website && (
                <a href={contributor.website} target="_blank" rel="noopener noreferrer">
                  {contributor.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>

        {articles.length > 0 && (
          <section className="section section--tight">
            <SectionBlock number="N°01" title="Stories" dateline="INVESTIGATIONS · REPORTING">
              <div className="work-rail">
                {articles.map((a) => (
                  <div className="work-rail__item" key={a.id}>
                    <Link href={`/stories/${a.slug}`}>{a.title}</Link>
                    <span className="work-rail__meta">
                      {a.category ?? "Story"} · {formatDate(a.published_at)}
                    </span>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </section>
        )}

        {episodes.length > 0 && (
          <section className="section section--tight">
            <SectionBlock number="N°02" title="Podcasts" dateline="HOST · EPISODES">
              <div className="work-rail">
                {episodes.map((ep) => (
                  <div className="work-rail__item" key={ep.id}>
                    <Link href={`/podcasts/${ep.show_slug}/${ep.id}`}>{ep.title}</Link>
                    <span className="work-rail__meta">
                      {ep.show_title} · {formatDate(ep.pub_date)}
                      {ep.duration_s ? ` · ${formatDurationLabel(ep.duration_s)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </section>
        )}

        {videos.length > 0 && (
          <section className="section section--tight">
            <SectionBlock number="N°03" title="Video" dateline="SERIES · EPISODES">
              <div className="work-rail">
                {videos.map((v) => (
                  <div className="work-rail__item" key={v.id}>
                    <Link href={`/shows/${v.series_slug}`}>{v.title}</Link>
                    <span className="work-rail__meta">
                      {v.series_title}
                      {v.published_at ? ` · ${formatDate(v.published_at)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </section>
        )}

        {lives.length > 0 && (
          <section className="section section--tight">
            <SectionBlock number="N°04" title="Live" dateline="BROADCASTS">
              <div className="work-rail">
                {lives.map((l) => (
                  <div className="work-rail__item" key={l.id}>
                    <Link href="/live">{l.title}</Link>
                    <span className="work-rail__meta">
                      {l.status}
                      {l.scheduled_start ? ` · ${formatDate(l.scheduled_start)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </section>
        )}

        {articles.length === 0 && episodes.length === 0 && videos.length === 0 && lives.length === 0 && (
          <section className="section section--tight">
            <p className="empty-state">Work from {contributor.name} will appear here as it is published.</p>
          </section>
        )}
      </InnerPageShell>
    </>
  );
}