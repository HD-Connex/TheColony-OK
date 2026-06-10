import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import InnerPageShell from "../_components/InnerPageShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "The Colony OK is Oklahoma's independent conservative press. Founded 2026. Reader-funded. Journalist-led.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      eyebrow="▼ THE IMPRINT · EST 2026"
      title="About The Colony"
      lede="An independent Oklahoma press. Investigative reporting, podcasting, and live programming — funded by readers, not advertisers."
      section={false}
    >
      <article className="prose-block" style={{ margin: "0 auto", paddingBlock: "var(--space-12)" }}>
        <p>
          The Colony OK was founded in 2026 to do the kind of long-form, accountability journalism that legacy press in
          Oklahoma had stopped doing — not for ideological reasons, but because the business model no longer supported it.
          Our answer: skip the advertisers. Charge readers a fair price. Hire reporters who can actually report.
        </p>

        <h2>Our Standards</h2>
        <p>
          Every story is filed by a named journalist. Every source is verified. Every public-records request, donor
          disclosure, or court filing we cite is linked or available on request. We correct errors prominently, never
          quietly.
        </p>

        <h2>Our Funding</h2>
        <p>
          Membership ($4.99/month) covers ~70% of editorial operations. The remainder comes from a founders&apos; donor
          list — disclosed at the bottom of this page. We do not accept gifts, junkets, or undisclosed retainers.
        </p>

        <h2>Our Beat</h2>
        <p>
          Oklahoma politics, culture, the economy, and the institutions — state, local, and federal — that shape life
          here. We cover statewide elections like they matter, because they do.
        </p>

        <h2>The Team</h2>
        {/* Aesthetic team life image */}
        <div className="section-lead-image">
          <Image
            src="/assets/images/hosts/jake-merrick.jpg"
            alt="The Colony OK team and masthead"
            width={800}
            height={300}
            className="img-aesthetic"
          />
        </div>
        <p>
          Editorial leadership:{" "}
          <Link href="/journalists">Sarah Mitchell, Marcus Webb, Rachel Torres, Pastor Dan Hollis, Wes Carter</Link> (5 on masthead post-seed). Founding
          publisher: Jake Merrick. Operations: JAM Media.
        </p>
      </article>
    </InnerPageShell>
  );
}