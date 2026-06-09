"use client";

interface EpisodeShareProps {
  title: string;
  url: string;
}

export default function EpisodeShare({ title, url }: EpisodeShareProps) {
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <section className="article__share" aria-label="Share episode">
      <span className="article__share-label">▼ SHARE</span>
      <button
        type="button"
        className="btn btn--outline btn--sm"
        onClick={() => navigator.share?.({ title, url }).catch(() => {})}
      >
        Share
      </button>
      <a href={tweet} target="_blank" rel="noopener noreferrer">
        X
      </a>
    </section>
  );
}