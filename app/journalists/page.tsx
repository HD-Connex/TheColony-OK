import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import SectionBlock from "../_components/SectionBlock";
import { getContributors } from "@/lib/contributors";

export const metadata: Metadata = {
  title: "Our Journalists",
  description:
    "The reporters, hosts, and editors behind The Colony OK. Named bylines. Verified work. Public contact.",
  alternates: { canonical: "/journalists" },
};

export const revalidate = 300;

function photoFor(slug: string, headshot: string | null): string {
  if (headshot) return headshot;
  if (slug.includes("marcus") || slug.includes("webb")) return "/assets/images/hosts/marcus-webb.jpg";
  if (slug.includes("rachel") || slug.includes("torres")) return "/assets/images/hosts/rachel-torres.jpg";
  if (slug.includes("dan") || slug.includes("hollis")) return "/assets/images/hosts/dan-hollis.jpg";
  if (slug.includes("jake") || slug.includes("merrick")) return "/assets/images/hosts/jake-merrick.jpg";
  return "/assets/images/author-1.svg";
}

function contactLine(c: { email: string | null; x_handle: string | null }) {
  const parts: string[] = [];
  if (c.email) parts.push(c.email);
  if (c.x_handle) parts.push(c.x_handle.startsWith("@") ? c.x_handle : `@${c.x_handle}`);
  return parts.join(" · ") || "Contact via tip line";
}

export default async function JournalistsPage() {
  const contributors = await getContributors().catch(() => []);
  const count = contributors.length || 4;

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Journalists" }]}
      eyebrow={`▼ THE MASTHEAD · ${count} ON STAFF`}
      title="Our Journalists"
      lede={
        <>
          Every story is filed by a named journalist. Reach out by email or social — addresses below. Tips can be sent
          securely via the{" "}
          <Link href="/submit-a-tip" style={{ color: "var(--color-alarm)", borderBottom: "1px solid" }}>
            tip line
          </Link>
          .
        </>
      }
      section={false}
    >
      <div className="journalist-grid">
        {contributors.length > 0 ? (
          contributors.map((c) => (
            <article className="journalist-card" key={c.id}>
              <div className="journalist-card__inner">
                <Image
                  className="journalist-card__photo"
                  src={photoFor(c.slug, c.headshot_url)}
                  alt={c.name}
                  width={80}
                  height={80}
                />
                <div>
                  {c.role && <p className="journalist-card__role">▼ {c.role}</p>}
                  <h2 className="journalist-card__name">
                    <Link href={`/contributors/${c.slug}`}>{c.name}</Link>
                  </h2>
                  {c.bio && <p className="journalist-card__bio">{c.bio}</p>}
                  <p className="journalist-card__contact">{contactLine(c)}</p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <>
            {[
              {
                name: "Sarah Mitchell",
                role: "INVESTIGATIONS EDITOR",
                bio: "Twelve years on the politics beat. Focus: campaign finance, public records, statehouse accountability.",
                contact: "sarah@thecolonyok.com · @sarahm_ok",
                slug: "sarah-mitchell",
              },
              {
                name: "Marcus Webb",
                role: "HOST · PATRIOT HOUR",
                bio: "Former Marine officer. Talk radio veteran. Focus: federal/state tension, constitutional law, foreign policy.",
                contact: "marcus@thecolonyok.com · @marcuswebb",
                slug: "marcus-webb",
              },
              {
                name: "Rachel Torres",
                role: "HOST · OK UNDERGROUND",
                bio: "Field reporter, formerly with KFOR. Rural Oklahoma, local government, and on-the-ground reporting.",
                contact: "rachel@thecolonyok.com · @rachel_ok",
                slug: "rachel-torres",
              },
              {
                name: "Pastor Dan Hollis",
                role: "HOST · FAITH & FREEDOM",
                bio: "Pastor of First Baptist Lawton, 22 years. Focus: faith in public life, religious liberty, community institutions.",
                contact: "dan@thecolonyok.com",
                slug: "dan-hollis",
              },
            ].map((j) => (
              <article className="journalist-card" key={j.slug}>
                <div className="journalist-card__inner">
                  <Image
                    className="journalist-card__photo"
                    src={photoFor(j.slug, null)}
                    alt={j.name}
                    width={80}
                    height={80}
                  />
                  <div>
                    <p className="journalist-card__role">▼ {j.role}</p>
                    <h2 className="journalist-card__name">
                      <Link href={`/contributors/${j.slug}`}>{j.name}</Link>
                    </h2>
                    <p className="journalist-card__bio">{j.bio}</p>
                    <p className="journalist-card__contact">{j.contact}</p>
                  </div>
                </div>
              </article>
            ))}
          </>
        )}
      </div>

      <section className="section">
        <SectionBlock number="N°02" title="Want to Contribute?" dateline="PITCH · FREELANCE · STAFF">
          <div className="prose-block" style={{ fontSize: "var(--text-lg)" }}>
            <p>
              We commission freelance investigative pieces and are hiring for two staff reporter roles. Send a pitch or
              résumé to <strong style={{ color: "var(--color-paper)" }}>editor@thecolonyok.com</strong> with three
              published clips.
            </p>
            <p>
              If you have a tip but don&apos;t want byline credit, the{" "}
              <Link href="/submit-a-tip" style={{ color: "var(--color-alarm)", borderBottom: "1px solid" }}>
                secure tip line
              </Link>{" "}
              is for you.
            </p>
          </div>
        </SectionBlock>
      </section>
    </InnerPageShell>
  );
}