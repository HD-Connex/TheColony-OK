# Image Asset Manifest

All images required for the homepage and Phase 2 pages. Path is relative to `/assets/images/`.

## Homepage (`index.html`)

| File | Dimensions | Purpose | Required By Phase |
|---|---|---|---|
| `hero-1.jpg` | 1920x1080 | Hero slide 1 — investigative report bg | Phase 1 |
| `hero-2.jpg` | 1920x1080 | Hero slide 2 — live show bg | Phase 1 |
| `story-lead.jpg` | 1200x675 | Top Stories lead — capitol building | Phase 1 |
| `story-2.jpg` | 600x400 | Secondary story — school board parents | Phase 1 |
| `story-3.jpg` | 600x400 | Secondary story — oil refinery | Phase 1 |
| `story-4.jpg` | 600x400 | Secondary story — sheriff badge | Phase 1 |
| `author-1.jpg` | 200x200 | Sarah Mitchell headshot | Phase 1 |
| `og-home.jpg` | 1200x630 | Open Graph share image | Phase 1 |
| `logo.png` | 600x60 | Schema.org logo | Phase 1 |

## Podcast Cover Art (square — 1400x1400 recommended for podcast platforms)

| File | Show |
|---|---|
| `podcast-colony-report.jpg` | The Colony Report (Jake Merrick) |
| `podcast-patriot-hour.jpg` | The Patriot Hour (Marcus Webb) |
| `podcast-ok-underground.jpg` | Oklahoma Underground (Rachel Torres) |
| `podcast-faith-freedom.jpg` | Faith & Freedom (Pastor Dan Hollis) |

## Icons (`/assets/icons/`)

| File | Purpose |
|---|---|
| `favicon.svg` | Tab favicon (vector preferred) |
| `apple-touch-icon.png` | 180x180 — iOS home screen |

## Optimization Standards

- **Format:** Serve JPG for photos, WebP for hero (with JPG fallback via `<picture>`), SVG for icons/logo
- **Compression:** Aim for ≤ 200KB per hero image, ≤ 80KB per card image
- **Lazy load:** All `<img>` outside the initial viewport must have `loading="lazy"`
- **Responsive:** Hero images should ship as `<picture>` with mobile (640w), tablet (1024w), desktop (1920w) variants once content is finalized

## Phase 2 Additions

When Phase 2 ships, add:
- Article hero images per published story (1200x675)
- Host headshots per podcast show (400x400)
- Live stream offline poster (1920x1080)
- Category banner images (1920x400)
