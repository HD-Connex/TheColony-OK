"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Manual Sentry capture (in addition to instrumentation onRequestError).
    Sentry.captureException(error);
  }, [error]);

  return (
    <main id="main">
      <div className="container">
        <section className="system-page" aria-labelledby="error-title">
          <p className="page-header__eyebrow">
            ▼ SYSTEM · FAULT
          </p>

          <div className="system-page__code" aria-hidden="true">
            ERR
          </div>

          <h1 id="error-title" className="system-page__title">
            Something Went Wrong.
          </h1>

          <p className="system-page__lede">
            This page hit an unexpected error. Try again, or return to a known
            section while we sort it out.
          </p>

          <div className="system-page__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={reset}>
              Try Again
            </button>
            <Link className="btn btn--outline btn--lg" href="/">
              Back to Front Page
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