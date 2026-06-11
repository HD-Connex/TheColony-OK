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

  const mediaItems: NavItem[] = [
    { href: "/shows", label: "Shows" },
    { href: "/podcasts", label: "Podcasts" },
    { href: "/live", label: "Watch Live" },
  ];

  const communityItems: NavItem[] = [
    { href: "/journalists", label: "Journalists" },
    { href: "/contributors/join", label: "Masthead" },
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
        {isOpen && (
          <div className="nav__dropdown-menu" role="menu">
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
        )}
      </div>
    );
  };

  // Desktop: full tabs + dropdowns visible. Hamburger + mobile ONLY on small screens.
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <>
      {/* Desktop: menu tabs displayed with grouped dropdowns (2-3 like pages per dd) */}
      <div className="nav__links">
        <Link className={`nav__link ${isActive("/stories") ? "nav__link--active" : ""}`} href="/stories">
          Stories
        </Link>

        <Dropdown id="media" label="Media" items={mediaItems} />

        <Link className={`nav__link ${isActive("/news") ? "nav__link--active" : ""}`} href="/news">
          News
        </Link>

        <Link className={`nav__link ${isActive("/counties") ? "nav__link--active" : ""}`} href="/counties">
          Counties
        </Link>

        <Dropdown id="community" label="Community" items={communityItems} />
      </div>

      <div className="nav__actions">
        <Link className="btn btn--outline btn--sm" href="/membership">
          Sign In
        </Link>
        <Link className="btn btn--primary btn--sm" href="/pricing">
          Join $4.99/mo
        </Link>
      </div>

      {/* Hamburger only on mobile (no presence on desktop) */}
      {isMobile && (
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
      )}

      {/* Mobile menu (flat list for simplicity; groups expanded in desktop dropdowns) */}
      {isMobile && (
        <div className={`nav__mobile${mobileOpen ? " is-open" : ""}`} id="mobile-menu" hidden={!mobileOpen}>
          <Link className="nav__link" href="/stories" onClick={closeAll}>
            Stories
          </Link>
          <Link className="nav__link" href="/shows" onClick={closeAll}>
            Shows
          </Link>
          <Link className="nav__link" href="/podcasts" onClick={closeAll}>
            Podcasts
          </Link>
          <Link className="nav__link nav__link--live" href="/live" onClick={closeAll}>
            Watch Live
          </Link>
          <Link className="nav__link" href="/news" onClick={closeAll}>
            Daily News
          </Link>
          <Link className="nav__link" href="/counties" onClick={closeAll}>
            Counties
          </Link>
          <Link className="nav__link" href="/journalists" onClick={closeAll}>
            Journalists
          </Link>
          <Link className="nav__link" href="/contributors/join" onClick={closeAll}>
            Masthead
          </Link>
          <Link className="btn btn--primary btn--full" href="/pricing" onClick={closeAll}>
            Join — $4.99/month
          </Link>
          <Link className="btn btn--outline btn--full" href="/membership" onClick={closeAll}>
            Sign In
          </Link>
        </div>
      )}
    </>
  );
}
