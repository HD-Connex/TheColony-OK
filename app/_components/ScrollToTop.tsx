"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Auto scroll to top on route change.
 * Also includes a floating "back to top" button that appears on scroll (for long pages).
 * Placed in root layout for sitewide effect.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Auto scroll to top on navigation (instant for better UX on content pages)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname]);

  // Optional: floating button (appears after 300px scroll)
  useEffect(() => {
    const btn = document.getElementById("scroll-to-top-btn");
    if (!btn) return;

    const onScroll = () => {
      if (window.scrollY > 300) {
        btn.classList.add("visible");
      } else {
        btn.classList.remove("visible");
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      id="scroll-to-top-btn"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="scroll-to-top"
      style={{
        position: "fixed",
        bottom: "var(--space-6)",
        right: "var(--space-6)",
        zIndex: 300,
        padding: "var(--space-2) var(--space-3)",
        background: "var(--color-alarm)",
        color: "var(--color-paper)",
        border: "var(--rule-medium) solid var(--color-paper)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        textTransform: "uppercase",
        letterSpacing: "var(--track-wide)",
        cursor: "pointer",
      }}
    >
      ▲ TOP
    </button>
  );
}
