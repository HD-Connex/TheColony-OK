import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Archivo_Black, Inter_Tight, JetBrains_Mono, Fraunces } from "next/font/google";
import "./styles/main.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import SiteChrome from "./_components/SiteChrome";
import SiteClient from "./_components/SiteClient";
import ScrollToTop from "./_components/ScrollToTop";

const SITE_URL = "https://thecolonyok.com";

// Note for P7: Production URLs hard-coded to https://thecolonyok.com for canonical/OG/metadataBase (canonical domain).
// Vercel preview deployments will use their *.vercel.app URLs (or NEXT_PUBLIC_SITE_URL if set in project envs);
// this is expected — previews differ for testing. sitemap.ts / robots.ts also fall back identically.
// PHASE 8 P7: preview hash URLs (thecolony-*-hd-connex.vercel.app etc) removed from docs/tests/README/load (replaced with prod https://thecolony-app.vercel.app or env); code paths already prefer process.env.NEXT_PUBLIC_SITE_URL (see layout note, lib/env, multiple api/pages). No old aliases remain in active sources.
// Eliminates external Google Fonts request, improves CWV/INP, removes layout shift.
const fontDisplay = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const fontSans = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const fontSerif = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Colony OK — Independent Oklahoma Press",
    template: "%s — The Colony OK",
  },
  description:
    "Oklahoma's independent conservative press. Investigative journalism, podcasting, live programming, and daily news — funded by readers, not advertisers.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "The Colony OK",
    url: SITE_URL,
    locale: "en_US",
    images: [{ url: "/assets/images/og-home.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@thecolonyok",
    images: ["/assets/images/og-home.jpg"],
  },
  icons: { icon: "/assets/images/logo-icon.jpg" },
  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} ${fontSerif.variable}`}>
      <head>
        {/* Phase 4: data-theme driven by SiteClient (localStorage + toggle). Default dark. Avoids FOUC via client setAttribute. See variables.css + main.css a11y/Lighthouse notes. */}
        {/* Phase 3-05: Removed external Google Fonts links (now via next/font above).
            Kept other preconnects for Stripe/YouTube/Rumble/Plausible perf. */}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://rumble.com" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        {/* Phase 7 LCP: preload hint for static cinematic hero bg (lead-hero.jpg used in .hero__primary::before CSS).
            Main LCP candidate remains the priority lead StoryCard image (Next auto-preloads via priority+fetchPriority).
            Static hero preload helps early paint; fonts via next/font (no external). */}
        <link rel="preload" as="image" href="/assets/images/heroes/lead-hero.jpg" fetchPriority="high" />
        {/* Also preload primary story asset used for default budget-crisis lead (media-map) to accelerate LCP img fetch. */}
        <link rel="preload" as="image" href="/assets/images/stories/oklahoma-budget-crisis.jpg" fetchPriority="high" />
      </head>
      <body>
        <SiteChrome header={<Header />} footer={<Footer />}>
          {children}
        </SiteChrome>
        <SiteClient />
        <ScrollToTop />
        <Script
          defer
          data-domain="thecolonyok.com"
          src="https://plausible.io/js/script.outbound-links.tagged-events.js"
        />
        <Analytics />
      </body>
    </html>
  );
}
