# Host / Personality Images for thecolony-app Root Project

These are the crisp, clean, perfect high-quality portraits for each personality/podcast host (Oklahoma vibes aesthetic: navy/cream/red palette, professional yet trendy but conservative, local Oklahoma wheat/land/prairie/state motifs, "Oklahoma Underground" style for one).

**Binaries in the root (pushed to latest-for-testing @ hizzy-made-it/thecolony-app):**

- `dan-hollis.jpg` — Experienced host (salt-pepper hair, navy blazer + cream shirt, red pin, wheat stalks + civic/church bg with flag)
- `jake-merrick.jpg` — Younger host (navy suit, cream shirt + red tie, flag+wheat pin, expansive wheat field bg)
- `marcus-webb.jpg` — Bearded host (navy suit + red tie, flag pin, OK state seal + "OKLAHOMA" + wheat bg)
- `rachel-torres.jpg` — Woman host (navy blazer + cream blouse, red OK pin + red accents/earrings, wheat field, "RACHEL TORRES | OKLAHOMA UNDERGROUND" label)

**Generated/refined:** via image_gen tool (prompts based on multimodal visual descriptions from read of the 4 crisp originals). Used for personality spotlight.

**Usage in root code:**
- ContributorCard.tsx, StoryCard.tsx, podcasts/[slug]/page.tsx : next/image + framer-motion (motion whileHover scale/pop for promoted) using the /assets/images/hosts/[name].jpg paths (slug/name match logic for jake/marcus/rachel/dan/hollis/pastor).
- See also MANIFEST.md for podcast covers.

Part of thecolony-app root consolidation on GitHub only (hizzy-made-it/thecolony-app, latest-for-testing branch). Framer, video player, live 24/7+realtime, and these images for spotlight are all in the root.