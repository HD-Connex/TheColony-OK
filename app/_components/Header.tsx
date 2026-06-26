import Link from "next/link";
import Image from "next/image";
import HeaderNav from "./HeaderNav";
import { getArticles } from "@/lib/articles";
import { formatTimeCT } from "@/lib/format";

function TickerItems({ items }: { items: { href: string; title: string; filed: string }[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <>
      {doubled.map((item, i) => (
        <span className="ticker__item" key={`${item.href}-${i}`}>
          <Link href={item.href}>{item.title}</Link>
          <span className="ticker__filed">{item.filed}</span>
        </span>
      ))}
    </>
  );
}

export default async function Header() {
  const articles = await getArticles({ limit: 5 });
  const tickerItems = articles.map((a) => ({
    href: `/stories/${a.slug}`,
    title: a.title,
    filed: formatTimeCT(a.published_at),
  }));

  if (!tickerItems.length) {
    tickerItems.push(
      { href: "/live", title: "Tonight 7PM — Colony Report with Jake Merrick", filed: "7:00 PM CT" },
      { href: "/pricing", title: "Join The Colony — independent press from $4.99/mo", filed: "OPEN" },
    );
  }

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <div className="breaking-bar" role="region" aria-label="Breaking news">
        <span className="breaking-bar__label">▼ FILED</span>
        <div className="ticker">
          <div className="ticker__track">
            <TickerItems items={tickerItems} />
          </div>
        </div>
      </div>

      <div className="container">
        <nav className="nav" aria-label="Main navigation">
          <Link className="nav__logo" href="/">
            <Image
              src="/assets/images/logo-dark.jpg"
              alt="The Colony"
              width={210}
              height={56}
              style={{ width: "auto", height: "2.5rem", display: "block" }}
              priority
            />
            <span className="nav__logo-mark">EST 2026 / N°01</span>
          </Link>
          <HeaderNav />
        </nav>
      </div>
    </header>
  );
}