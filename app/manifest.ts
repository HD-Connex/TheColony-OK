import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Colony OK - Rural Conservative Hub',
    short_name: 'The Colony',
    description: 'Oklahoma-rooted reader-funded conservative media with live, podcasts, exclusives. Hyper-local rural depth. Member clips, offline PWA.',
    id: '/',
    start_url: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F0E6', // cream per DS
    theme_color: '#0A2540', // navy per DS
    // Don't lock orientation: a video product needs landscape for fullscreen viewing
    // and rotation in standalone/TWA. (Was "portrait".)
    orientation: "any",
    categories: ["news", "entertainment", "education"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/assets/images/og-home.jpg",
        sizes: "1280x720",
        type: "image/jpeg",
        form_factor: "wide",
        label: "The Colony OK home — live, podcasts, rural reporting",
      },
    ],
    shortcuts: [
      { name: 'Live', url: '/live' },
      { name: 'Podcasts', url: '/podcasts' },
      { name: 'Member Clips Hub', url: '/live#clips' }, // Phase 3 clips surface
    ],
    // TWA / share ready (future clip upload via share sheet)
    prefer_related_applications: false,
    // TWA Phase 8: standalone + theme + icons (maskable for adaptive) already aligned to MOBILE_TWA_PWA_STRATEGY.md.
    // Android assetlinks.json (public/.well-known) + Play Store listing notes in docs. Icons: /icon-192.png etc exist + crisp.
    // share_target for clip upload from other apps (Phase 3+)
    // share_target: { action: "/submit-a-tip", method: "POST", enctype: "multipart/form-data", params: { title: "title", text: "text", url: "url", files: [{ name: "clip", accept: ["video/*", "audio/*"] }] } },
  };
}