import Link from 'next/link';
import React from 'react';

interface Props {
  count?: number;
  showLink?: boolean;
}

export default function ClipsTeaser({ count = 12, showLink = true }: Props) {
  return (
    <div className="clips-teaser" aria-label="Community clips">
      <div className="clips-teaser__header">
        <span className="mono-eyebrow">▼ COMMUNITY IN ACTION</span>
        <span className="clips-teaser__count">{count} recent member clips</span>
      </div>
      <p className="clips-teaser__desc">
        Ranch reports, faith moments, local ag updates — uploaded by members, transcribed, featured across the hub and live.
      </p>
      {showLink && (
        <Link href="/pricing" className="btn btn--outline btn--sm">
          Upload your 30s clip (Members)
        </Link>
      )}
    </div>
  );
}
