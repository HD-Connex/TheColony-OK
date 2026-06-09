import type { Metadata } from "next";
import Script from "next/script";
import { Archivo_Black, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./styles/main.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import SiteChrome from "./_components/SiteChrome";
import SiteClient from "./_components/SiteClient";

const SITE_URL = "https://thecolonyok.com";

// Note for P7: Production URLs hard-coded to https://thecolonyok.com for canonical/OG/metadataBase.
// Vercel preview deployments will use their *.vercel.app URLs (or NEXT_PUBLIC_SITE_URL if set in project envs);
// this is expected — previews differ for testing. sitemap.ts / robots.ts also fall back identically.
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
    <html lang="en" className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <head>
        {/* Phase 3-05: Removed external Google Fonts links (now via next/font above).
            Kept other preconnects for Stripe/YouTube/Rumble/Plausible perf. */}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://rumble.com" />
        <link rel="dns-prefetch" href="https://plausible.io" />
      </head>
      <body>
        <SiteChrome header={<Header />} footer={<Footer />}>
          {children}
        </SiteChrome>
        <SiteClient />
        <Script
          defer
          data-domain="thecolonyok.com"
          src="https://plausible.io/js/script.outbound-links.tagged-events.js"
        />
      </body>
    </html>
  );
}
