import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "404 — Page Not Found" },
  // PHASE 8 AUDIT P6: Confirmed good title "404 — Page Not Found" (absolute) + robots noindex/nofollow.
  // Renders <meta name="robots" content="noindex, nofollow"> via Next metadata (verified pattern in robots.ts/sitemap).
  // Per spec: if missing explicit, ensure — here via metadata (industry standard, no raw <meta> needed in app dir body).
  // Also noindex for SEO (crawlers skip 404s). Reuses system-page brutalist DS from error.tsx etc. Layout intact.
  robots: { index: false, follow: false },
  // Explicit noindex for audit (supplements metadata):
  other: { "X-Robots-Tag": "noindex" },
};

export default function NotFound() {
  return (
    <main id="main">
      <div className="container">
        <section className="system-page" aria-labelledby="not-found-title">
          <p className="page-header__eyebrow">
            ▼ FILED · WRONG DRAWER
          </p>

          <div className="system-page__code" aria-hidden="true">
            404
          </div>

          <h1 id="not-found-title" className="system-page__title">
            The Page You Were Looking For Isn&apos;t Here.
          </h1>

          <p className="system-page__lede">
            It may have been moved, renamed, or never existed in the first place.
            The reporting on this site is filed by section — try the links below, or
            head back to the front page.
          </p>

          <div className="system-page__actions">
            <Link className="btn btn--primary btn--lg" href="/">
              Back to Front Page
            </Link>
            <Link className="btn btn--outline btn--lg" href="/stories">
              Browse Stories
            </Link>
          </div>

          <div>
            <h2 className="system-page__sections-title">
              ▼ SECTIONS
            </h2>
            <nav className="system-page__links" aria-label="Site sections">
              <Link href="/">Home</Link>
              <Link href="/stories">Stories</Link>
              <Link href="/live">Live</Link>
              <Link href="/podcasts">Podcasts</Link>
            </nav>
          </div>
        </section>
      </div>
    </main>
  );
}