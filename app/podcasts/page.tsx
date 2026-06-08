import Link from 'next/link';
export default function PodcastsIndex() {
  return <main><h1>Podcasts</h1><p>Visit /podcasts/[slug]/[ep] for per-ep with perfected player (framer reduced motion, Spotify video toggle, WebAudio viz, PiP, chapters).</p><Link href="/podcasts/ok-underground/1">Example per-ep</Link></main>;
}