"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Image from "next/image";
import type { ShowWithCount } from "@/lib/podcasts";
import { PODCAST_ART, podcastCover, safeStockImage, stockUnoptimized } from "@/lib/media-map";

interface Props {
  shows: ShowWithCount[];
}

export default function PodcastSearchGrid({ shows }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shows;
    return shows.filter((show) => {
      const haystack = `${show.title} ${show.host}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [shows, query]);

  return (
    <>
      <div className="podcast-filter">
        <label className="podcast-filter__label" htmlFor="podcast-search">
          ▼ FILTER
        </label>
        <input
          id="podcast-search"
          className="podcast-filter__input"
          type="search"
          placeholder="SHOW OR HOST NAME"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No shows match that filter.</p>
      ) : (
        <div className="podcast-grid" id="podcast-grid">
          {filtered.map((show, i) => (
            <Link
              className="podcast-card"
              href={`/podcasts/${show.slug}`}
              key={show.slug}
              data-name={`${show.title} ${show.host}`.toLowerCase()}
            >
              <span className="podcast-card__number">SHOW N°{String(i + 1).padStart(2, "0")}</span>
              <div className="podcast-card__art">
                <Image
                  src={podcastCover(show.slug, show.cover_url)}
                  alt={`${show.title} — The Colony OK podcast cover`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="img-cover"
                  unoptimized={stockUnoptimized(podcastCover(show.slug, show.cover_url))}
                />
                <div className="podcast-card__play">
                  <div className="podcast-card__play-icon">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="podcast-card__body">
                <div className="podcast-card__show-name">{show.title}</div>
                <div className="podcast-card__host">{show.host}</div>
                <div className="podcast-card__meta">
                  <span className="podcast-card__episodes">{show.episodes} Episodes</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}