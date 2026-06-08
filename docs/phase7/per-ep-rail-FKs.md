# Extend per-ep rail with full host/episode/image/reel FKs + semantic recs

**From Track B Auditor (id 019ea69b-1894-7d02-8087-1ab30efe21bb) proposals for Layer 5.**

Example schema (Supabase/Postgres):
- hosts (id, name, image_id, bio, slug, ...)
- images (id, url, variant: portrait|ok_motif|social, alt, ...)
- reels (id, host_id, episode_id, clip_url, timestamp, title, ...)
- episodes (id, ..., host_id, image_id, reel_ids: jsonb or join table, ...)

Queries (extend lib/contributors.ts + lib/podcasts.ts):
- getMixedWorkForHost(hostId): episodes + videos + lives + articles + reels via FKs.
- semanticRecs(hostId or episodeId): similarity by host/OK topic + mixed content.

Integrate Layer 4 visuals (images from pipeline) + Layer 6 markup (Person/VideoObject with images).

Apply in per-ep page (proposed-changes/app/podcasts/[slug]/[ep]/page.tsx) and contributor pages.

**Perfection notes:** Exhaustive edges (no images, mobile, auth), types, comments, perf, a11y. Use implement-and-review + best-of-n for query variants.

**Evidence of Win:** Full relational mixed + complete bylines + semantic recs + local OK spotlight > Blaze/DW partial siloed host lists.

*Proxy for local apply via search_replace or copy to project.*
