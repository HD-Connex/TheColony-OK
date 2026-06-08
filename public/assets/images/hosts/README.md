# Host / Personality Images for thecolony-app Root Project

These are the crisp, clean, perfect images for each personality/podcast host (Oklahoma vibes aesthetic: navy/cream/red, professional yet trendy, local spotlight energy).

**Source (gathered from C: session proxy since D: drive malfunctioned):** 
C:\Users\hizzysdreambox\.grok\sessions\D%3A%5C1Projects%5Cthecolony-app\019ea4ef-b4d9-7160-a696-8a905df10291\images\

**Mapping to root project (public/assets/images/hosts/):**
- Use the 4 jpgs with names matching code: jake-merrick.jpg, marcus-webb.jpg, rachel-torres.jpg, dan-hollis.jpg (or update [slug]page hostPhoto logic + per-ep rail).
- Alternative names in some notes (robert-kane etc) for future; current code uses the 4 above for spotlight.

**Usage in root:**
- ContributorCard, per-ep rail, personality spotlight pages use next/image with these (alt="[Name], The Colony OK personality", sizes, lazy).
- OK motifs: subtle land/wheat overlays if editing.
- From TRACK_B_Perfection_Patches (pushed in this repo): Add to design system for density vs competitors (Daily Wire carousels, Blaze grids).

When cloning this thecolony-app repo to D:\1Projects\thecolony-app (or your restored location), copy the 4 jpgs from the session path above (or your local backup) into this public/assets/images/hosts/ folder BEFORE npm run dev / deploy. Upload via GitHub web UI (Add file > upload) to the branch if not using local git.

These spotlight the journalist contributions as requested. Part of the consolidated root project in thecolony-app only (GitHub hizzy-made-it/thecolony-app).

**For Vercel:** Images in public/ are served statically from the GH branch deploy.
