"use client";

interface EpisodeShareProps {
  title: string;
  url: string;
}

export default function EpisodeShare({ title, url }: EpisodeShareProps) {
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <section className="share">
      <h3>Share</h3>
      <button
        type="button"
        onClick={() => navigator.share?.({ title, url }).catch(() => {})}
      >
        Share episode
      </button>
      <a href={tweet} target="_blank" rel="noopener noreferrer">
        X
      </a>
    </section>
  );
}