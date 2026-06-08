import Link from "next/link";
import LiveNowBar from "./LiveNowBar";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo">
          The Colony
        </Link>
        <LiveNowBar />
        <nav className="site-header__nav" aria-label="Primary">
          <Link href="/live">Live</Link>
          <Link href="/shows">Shows</Link>
          <Link href="/podcasts">Podcasts</Link>
          <Link href="/news">News</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
      </div>
    </header>
  );
}