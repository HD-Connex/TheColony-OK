"use client";

import Link from "next/link";
import { useState } from "react";

export default function HeaderNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="nav__links">
        <Link className="nav__link" href="/stories">
          Stories
        </Link>
        <Link className="nav__link" href="/shows">
          Shows
        </Link>
        <Link className="nav__link" href="/podcasts">
          Podcasts
        </Link>
        <Link className="nav__link nav__link--live" href="/live">
          <span className="badge badge--live">LIVE</span>
          Watch
        </Link>
        <Link className="nav__link" href="/news">
          News
        </Link>
        <Link className="nav__link" href="/journalists">
          Journalists
        </Link>
        <Link className="nav__link" href="/contributors/join">
          Masthead
        </Link>
      </div>

      <div className="nav__actions">
        <Link className="btn btn--outline btn--sm" href="/membership">
          Sign In
        </Link>
        <Link className="btn btn--primary btn--sm" href="/pricing">
          Join $4.99/mo
        </Link>
      </div>

      <button
        type="button"
        className="nav__hamburger"
        aria-label="Toggle menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav__mobile${open ? " is-open" : ""}`} id="mobile-menu" hidden={!open}>
        <Link className="nav__link" href="/stories" onClick={() => setOpen(false)}>
          Stories
        </Link>
        <Link className="nav__link" href="/shows" onClick={() => setOpen(false)}>
          Shows
        </Link>
        <Link className="nav__link" href="/podcasts" onClick={() => setOpen(false)}>
          Podcasts
        </Link>
        <Link className="nav__link nav__link--live" href="/live" onClick={() => setOpen(false)}>
          Watch Live
        </Link>
        <Link className="nav__link" href="/news" onClick={() => setOpen(false)}>
          Daily News
        </Link>
        <Link className="nav__link" href="/journalists" onClick={() => setOpen(false)}>
          Journalists
        </Link>
        <Link className="nav__link" href="/contributors/join" onClick={() => setOpen(false)}>
          Masthead
        </Link>
        <Link className="btn btn--primary btn--full" href="/pricing" onClick={() => setOpen(false)}>
          Join — $4.99/month
        </Link>
        <Link className="btn btn--outline btn--full" href="/membership" onClick={() => setOpen(false)}>
          Sign In
        </Link>
      </div>
    </>
  );
}