# Host / Personality Images

Placeholder headshots live here so `next/image` never 404s in dev or production. Replace with crisp OK-aesthetic portraits when available.

## File mapping (code → asset)

| Slug / match | File | Used by |
|--------------|------|---------|
| `jake-merrick` or name contains "jake" | `jake-merrick.jpg` | `ContributorCard`, `StoryCard`, `app/podcasts/[slug]/page.tsx` |
| name contains "marcus" | `marcus-webb.jpg` | same |
| name contains "rachel" or "torres" | `rachel-torres.jpg` | same |
| name contains "dan", "hollis", or "pastor" | `dan-hollis.jpg` | same |
| all other contributors (no `headshot_url`) | `/assets/images/author-1.svg` | same |

Resolution order in components: `contributor.headshot_url` → host JPG above → `author-1.svg`.

## Current placeholders

- **Host JPGs** — minimal valid 1×1 JPEG stubs (regenerate: `node scripts/create-host-placeholders.mjs`).
- **`author-1.svg`** — cream/navy/red generic avatar at `public/assets/images/author-1.svg`.

## Replacing with real photos

1. Drop 4 JPGs into this folder using the exact filenames above (square crop, ≥ 320×320 recommended).
2. Optional: set `headshot_url` on contributor records to override slug-based mapping.
3. Commit binaries to the repo branch Vercel deploys from (`public/` is served statically).

## Aesthetic notes

Oklahoma vibes: navy (`#1a2b4a`), cream (`#e8e4dc`), accent red (`#c41e3a`). Professional local-spotlight energy for personality cards and podcast rails.