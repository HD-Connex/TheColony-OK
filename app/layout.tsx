import type { Metadata } from "next";
import Script from "next/script";
import "./styles/main.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import SiteChrome from "./_components/SiteChrome";
import SiteClient from "./_components/SiteClient";

const SITE_URL = "https://thecolonyok.com";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://rumble.com" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter+Tight:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
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
