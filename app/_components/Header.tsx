import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <nav>
        <Link href="/">The Colony OK</Link>
        <Link href="/podcasts">Podcasts</Link>
        <Link href="/live">Live</Link>
        <Link href="/stories">Stories</Link>
        <Link href="/membership">Join</Link>
      </nav>
    </header>
  );
}
