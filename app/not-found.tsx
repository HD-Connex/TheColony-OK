import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "404 — Page Not Found" },
  robots: { index: false, follow: false },
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