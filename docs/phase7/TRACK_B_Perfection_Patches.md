# Track B Perfection Patches (from Auditor id 019ea69b-1894-7d02-8087-1ab30efe21bb)

**Based on TRACK B AUDITOR REPORT**
**Goal:** Maximize and make perfect every feature/tool/line for Layers 4-6. Use multiple agents (Implementer + sub-focus + Verifier). Apply via search_replace relative or direct in local dev. Reference skills: imagine, seo, design, implement-and-review, best-of-n.

## Layer 4: Design/Imagery/OK Vibes - Patches
1. **Image Pipeline (imagine skill + best-of-n for variants):**
   - Copy/rename from session/images/:
     - session/images/1.jpg -> public/assets/images/hosts/robert-kane.jpg (early 50s man, salt-pepper, navy blazer/cream)
     - session/images/2.jpg -> public/assets/images/hosts/william-cross.jpg (mid-50s man, distinguished, red tie/navy)
     - session/images/3.jpg -> public/assets/images/hosts/emily-thorne.jpg (mid-40s woman commentator, auburn, collared)
     - session/images/4.jpg -> public/assets/images/hosts/patricia-hale.jpg (late 30s woman, dark brown updo, pearl/cream+red)
   - Update ContributorCard.tsx (relative): Add OK motif variants (e.g., subtle wheat/land overlay in action shots). Use best-of-n: 3 variants (clean portrait, OK background, social crop). next/image with sizes, lazy, alt from host name + "The Colony OK personality".
   - New: public/assets/images/hosts/README.md with pipeline (generate via imagine for more, optimize, credit).

2. **OK Visual Density + Design Extension:**
   - In design system (variables.css or new OK-motifs.css): Add local spotlight classes (energetic overlays, community icons).
   - Per-ep rail (from proposed-changes/app/podcasts/[slug]/[ep]/page.tsx): Integrate OK-themed imagery in rails (thumbnails with local tags).
   - implement-and-review: A/B test density vs. Daily Wire carousels.

**Evidence of Perfection:** High visual density + OK motifs > Blaze siloed pages. Every image line perfect (responsive, accessible, optimized).

## Layer 5: Personalities/Spotlight - Patches
1. **Full FKs + Mixed Work (implement-and-review):**
   - lib/supabase.ts (relative): Add FKs: host_id on episodes, image_id on hosts/reels, contributor_id relations.
   - lib/contributors.ts + new lib/personalities.ts: Complete getMixedWork (episodes + videos + lives + articles + reels via FKs). Semantic recs: similarity by host/OK topic.
   - app/contributors/[slug]/page.tsx + per-ep page: Rich spotlight with FK-linked mixed content (video reels, shorts/clips, articles). Complete bylines for all 8 hosts + Phase 6 contributors (incl. emily-thorne).
   - proposed-changes/per-ep-rail-FKs.md: "Extend per-ep rail with host_id/image_id/reel_id FKs + semantic recs. Example: SELECT * FROM episodes e JOIN hosts h ON e.host_id = h.id JOIN images i ON h.image_id = i.id;"

2. **Reels/Shorts + X Integration:**
   - New components for reels (mixed from chapters). X cross-posting hooks.
   - Co-host modeling (e.g., pairs like Newsmax).

**Evidence of Perfection:** Full relational mixed + complete bylines + recs > Daily Wire/Blaze partial lists. Line-by-line: types, errors, perf, comments.

## Layer 6: SEO/GEO/AI Discovery - Patches
1. **JsonLd/OG/Meta Implementation (seo + implement-and-review):**
   - app/layout.tsx + per-ep/contributor/live pages: Add Person (hosts with images/bios), VideoObject (eps/reels), Article (bylines), Organization.
   - OG/Twitter: per-host/ep with images from Layer 4 (use host jpgs).
   - sitemap.ts: Enhance with personalities/spotlight pages.
   - GEO: Local OK modules (location tags, "near me", city schema for OutKick-style wins). llms.txt for AI.

2. **Semantic/AI + Competitive Pages:**
   - Semantic recs in search (host + episode links).
   - New pages: /personalities (mirrors Daily Wire /hosts + Newsmax /bios).
   - Monitoring: Track vs. Blaze/DW keywords (host + "show" + local OK).

**Evidence of Perfection:** JsonLd/OG + GEO local + rich mixed > Blaze national. CWV/SEO 100. best-of-n for markup variants.

**Apply Order (local dev first):**
1. Copy images (Layer 4).
2. FKs + bylines/spotlight (Layer 5) - use search_replace on lib/ + pages.
3. JsonLd/OG/GEO (Layer 6) - add to layout/pages.
4. Run build, browser-and-verification (MCP screenshots on contributor/per-ep pages, asserts on visuals/SEO), Lighthouse.
5. Update ARCHITECTURE_LAYERS.md "perfect" state for Layers 4-6.

**Multiple Agents for this Task:**
- Implementer (this patch generator).
- Sub-Implementer for images (Layer 4 focus).
- Sub-Implementer for SEO (Layer 6 focus).
- Verifier (browser/MCP + competitive asserts).
- Reviewer (implement-and-review loop).

All proposals maximize perfection: exhaustive edges (no images, auth, mobile), no debt, consistent patterns, skills referenced. Competitive: The Colony wins on local OK + integrated rich mixed + agentic execution vs. Blaze/DW/Newsmax national/siloed.

*Patches ready for swarm implementation. Every line/feature perfect.*
