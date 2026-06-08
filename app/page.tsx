import Link from 'next/link';
export default function Home() {
  return (
    <main>
      <h1>The Colony OK</h1>
      <p>Independent Oklahoma press — podcasts, live, news.</p>
      <nav>
        <Link href="/live">Watch Live</Link> | <Link href="/podcasts">Podcasts</Link>
      </nav>
      <p><small>Root consolidated on latest-for-testing. See TESTING_DEPLOY.md</small></p>
    </main>
  );
}