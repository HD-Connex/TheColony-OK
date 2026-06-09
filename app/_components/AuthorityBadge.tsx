import React from 'react';

interface Props {
  verified?: boolean;
  tier?: string;
  className?: string;
}

export default function AuthorityBadge({ verified = true, tier, className = '' }: Props) {
  return (
    <span className={`authority-badge ${className}`} aria-label={verified ? "Verified journalist" : undefined}>
      {verified && <span className="authority-badge__icon">✓</span>}
      {verified && "Verified"}
      {tier && <span className="authority-badge__tier"> · {tier}</span>}
    </span>
  );
}
