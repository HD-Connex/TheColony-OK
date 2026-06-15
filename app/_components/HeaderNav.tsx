"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export default function HeaderNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  const closeAll = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Fox News-style horizontal main menu — adapted to The Colony's unique offering.
  // NO HAMBURGER ON DESKTOP: full horizontal with logical dropdowns combining "like pages".
  // Desktop always shows grouped categories (Investigations + News flat; Media group; Local group; Community).
  // Mobile (small screens only) uses hamburger + expanded list.
  // Brutalist DS: uppercase mono, alarm accents, heavy rules, zero-radius.
  const mainNav: NavItem[] = [
    { href: "/stories", label: "Investigations" },
    { href: "/news", label: "News" },
  ];

  const mediaItems: NavItem[] = [
    { href: "/watch", label: "Watch" },
    { href: "/podcasts", label: "Podcasts" },
    { href: "/shows", label: "Shows" },
    { href: "/live", label: "Live" },
    { href: "/clips", label: "Dispatches" },
  ];

  const localItems: NavItem[] = [
    { href: "/counties", label: "Counties" },
    { href: "/topics", label: "Topics" },
    { href: "/report-card", label: "Report Card" },
  ];

  const communityItems: NavItem[] = [
    { href: "/blog", label: "Blog" },
    { href: "/my-feed", label: "My Feed" },
    { href: "/journalists", label: "Journalists" },
    { href: "/contributors/join", label: "Masthead" },
    { href: "/backroom", label: "Backroom" },
  ];

  const Dropdown = ({ id, label, items }: { id: string; label: string; items: NavItem[] }) => {
    const isOpen = openDropdown === id;
    const hasActive = items.some((i) => isActive(i.href));

    return (
      <div
        className="nav__dropdown"
        onMouseEnter={() => setOpenDropdown(id)}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <button
          type="button"
          className={`nav__link nav__dropdown-trigger ${hasActive ? "nav__link--active" : ""}`}
          onClick={() => setOpenDropdown(isOpen ? null : id)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {label} <span className="nav__caret">▾</span>
        </button>
        {/* Menu content is always rendered (for reliable CSS :hover on desktop).
            Visibility is controlled by CSS:
            - Base: display:none (add this if not present)
            - Desktop hover: .nav__dropdown:hover .nav__dropdown-menu { display:block }
            - JS open state: .is-open class also forces display:block (for click toggle / a11y)
            This makes dropdowns "actually working" on desktop even if mouse events have any timing quirk. */}
        <div
          className={`nav__dropdown-menu ${isOpen ? "is-open" : ""}`}
          role="menu"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav__dropdown-item ${isActive(item.href) ? "active" : ""}`}
              onClick={closeAll}
              role="menuitem"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // Desktop: full tabs + dropdowns visible. Hamburger + mobile ONLY on small screens.
  // P2-16 mobile nav polish: ALWAYS render the .nav__mobile drawer in DOM (SSR safe, no conditional on isMobile).
  // Visibility controlled purely by CSS (.nav__mobile {display:none} + .is-open {flex} + @media max-1024 {block for hamburger}).
  // This fixes "Mobile nav menu unclear" / hydration/click timing issues from prior audit (isMobile state + hidden attr could mask functional toggle).
  // Hamburger onClick always toggles state; on mobile viewport the class makes menu appear/clear. Desktop media hides completely.
  // We still track isMobile (matchMedia) for potential future behaviors, but render gate removed.
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <>
      {/* DESKTOP ONLY: Fox-style grouped horizontal nav. NO HAMBURGER EVER ON DESKTOP.
          Grouped to combine like pages in dropdowns: core beats flat, Media (podcasts+shows+live+dispatches), Local (counties+reportcard), Community.
          Always rendered; hidden on mobile via CSS media query. */}
      <div className="nav__desktop">
        <div className="nav__links">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              className={`nav__link ${isActive(item.href) ? "nav__link--active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Dropdown id="media" label="Media" items={mediaItems} />
          <Dropdown id="local" label="Local" items={localItems} />
          <Dropdown id="community" label="Community" items={communityItems} />
        </div>

        <div className="nav__actions">
          <Link href="/search" className="nav__link nav__search" aria-label="Search the site">
            SEARCH
          </Link>
          <Link className="btn btn--outline btn--sm" href="/membership">
            Sign In
          </Link>
          <Link className="btn btn--primary btn--sm" href="/pricing">
            Join $4.99/mo
          </Link>
        </div>
      </div>

      {/* Hamburger button is ALWAYS rendered (for mobile).
          P2-16 polish: mobile drawer ALWAYS in DOM (no isMobile render gate, no hidden= attr).
          CSS @media (max-width:1024px) + .is-open controls show/hide + layout. Desktop media hides .nav__mobile + hamburger entirely.
          Makes hamburger fully functional/clear on mobile viewports (addresses audit "Mobile nav menu unclear"). Click toggles state reliably, class drives visibility. */}
      <button
        type="button"
        className="nav__hamburger"
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav__mobile${mobileOpen ? " is-open" : ""}`} id="mobile-menu">
        {/* Flat list of all pages for mobile usability */}
        <Link className={`nav__link ${isActive('/stories') ? "nav__link--active" : ""}`} href="/stories" onClick={closeAll}>Investigations</Link>
        <Link className={`nav__link ${isActive('/news') ? "nav__link--active" : ""}`} href="/news" onClick={closeAll}>News</Link>
        <Link className={`nav__link ${isActive('/podcasts') ? "nav__link--active" : ""}`} href="/podcasts" onClick={closeAll}>Podcasts</Link>
        <Link className={`nav__link ${isActive('/shows') ? "nav__link--active" : ""}`} href="/shows" onClick={closeAll}>Shows</Link>
        <Link className={`nav__link ${isActive('/live') ? "nav__link--active" : ""}`} href="/live" onClick={closeAll}>Live</Link>
        <Link className={`nav__link ${isActive('/watch') ? "nav__link--active" : ""}`} href="/watch" onClick={closeAll}>Watch</Link>
        <Link className={`nav__link ${isActive('/clips') ? "nav__link--active" : ""}`} href="/clips" onClick={closeAll}>Dispatches</Link>
        <Link className={`nav__link ${isActive('/counties') ? "nav__link--active" : ""}`} href="/counties" onClick={closeAll}>Counties</Link>
        <Link className={`nav__link ${isActive('/topics') ? "nav__link--active" : ""}`} href="/topics" onClick={closeAll}>Topics</Link>
        <Link className={`nav__link ${isActive('/report-card') ? "nav__link--active" : ""}`} href="/report-card" onClick={closeAll}>Report Card</Link>
        <Link className="nav__link" href="/blog" onClick={closeAll}>Blog</Link>
        <Link className="nav__link" href="/my-feed" onClick={closeAll}>My Feed</Link>
        <Link className="nav__link" href="/journalists" onClick={closeAll}>Journalists</Link>
        <Link className="nav__link" href="/contributors/join" onClick={closeAll}>Masthead</Link>
        <Link className="nav__link" href="/backroom" onClick={closeAll}>The Backroom</Link>
        <Link className="nav__link" href="/search" onClick={closeAll}>Search</Link>
        <Link className="btn btn--primary btn--full" href="/pricing" onClick={closeAll}>Join — $4.99/month</Link>
        <Link className="btn btn--outline btn--full" href="/membership" onClick={closeAll}>Sign In</Link>
      </div>
    </>
  );
}
