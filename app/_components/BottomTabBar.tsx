"use client";

/**
 * BottomTabBar — FOX-style persistent mobile tab nav (Home / Watch / Listen /
 * Read / Account). Mobile only; hidden ≥1025px via app-shell.css. Active state
 * from the current path. Brutalist DS: ink bar, alarm active accent, mono labels.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: React.ReactNode };

const I = {
  home: (
    <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
  ),
  watch: (
    <>
      <rect x="2" y="4" width="20" height="14" />
      <polygon points="10,8 16,11 10,14" fill="currentColor" stroke="none" />
    </>
  ),
  listen: (
    <>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="4" height="7" />
      <rect x="17" y="13" width="4" height="7" />
    </>
  ),
  read: (
    <>
      <path d="M4 5h7v15H4z" />
      <path d="M13 5h7v15h-7z" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
};

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: I.home },
  { href: "/watch", label: "Watch", icon: I.watch },
  { href: "/podcasts", label: "Listen", icon: I.listen },
  { href: "/news", label: "Read", icon: I.read },
  { href: "/membership", label: "Account", icon: I.account },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="bottom-tabs" aria-label="Primary mobile navigation">
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottom-tabs__tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <svg
              className="bottom-tabs__icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
            <span className="bottom-tabs__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
