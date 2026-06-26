'use client';

import React from 'react';

// ClipEmbed for Phase 2/3 clips layer.
// Per frontend-design + DS (zero-radius via .card, mono, alarm, spatial rules, no inline).
// Reuses card patterns. TWA friendly. Video controls native. Reduced-motion via parent.

interface ClipEmbedProps {
  clip: {
    id: string;
    url: string;
    transcript?: string;
    title?: string;
    duration_s?: number;
    tags?: string[];
  };
  compact?: boolean;
}

export default function ClipEmbed({ clip, compact = false }: ClipEmbedProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [clipError, setClipError] = React.useState(false);

  const dur = clip.duration_s
    ? `${Math.floor(clip.duration_s / 60)}:${(clip.duration_s % 60).toString().padStart(2, '0')}`
    : null;

  if (clipError) {
    return (
      <div className={`clip-embed ${compact ? 'compact' : ''} card`}>
        <div className="clip-embed__header">
          <span className="mono-eyebrow clip-embed__label">▼ MEMBER CLIP</span>
          {dur && <span className="clip-embed__dur">{dur}</span>}
        </div>
        <div className="clip-embed__player">
          <div className="live-player__offline">
            <span className="live-player__status">CLIP UNAVAILABLE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`clip-embed ${compact ? 'compact' : ''} card`}>
      <div className="clip-embed__header">
        <span className="mono-eyebrow clip-embed__label">▼ MEMBER CLIP</span>
        {dur && <span className="clip-embed__dur">{dur}</span>}
      </div>

      <div className="clip-embed__player">
        <video
          src={clip.url}
          controls
          playsInline
          className={compact ? 'compact' : ''}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setClipError(true)}
        />
        {clip.tags && clip.tags.length > 0 && (
          <div className="clip-embed__tags">
            {clip.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="badge badge--members clip-embed__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {clip.title && <h4 className="clip-embed__title">{clip.title}</h4>}

      {clip.transcript && !compact && (
        <p className="clip-embed__transcript text-xs">
          {clip.transcript.substring(0, 120)}...
        </p>
      )}

      <div className="clip-embed__meta">
        Approved member clip • Embed in live/hub/comments
      </div>
    </div>
  );
}

