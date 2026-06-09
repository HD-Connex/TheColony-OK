import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Colony OK - Rural Conservative Hub',
    short_name: 'The Colony',
    description: 'Oklahoma-rooted reader-funded conservative media with live, podcasts, exclusives. Hyper-local rural depth.',
    start_url: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F0E6', // cream
    theme_color: '#0A2540', // navy
    orientation: "portrait",
    categories: ["news", "entertainment", "education"],
    icons: [
      {
        src: "/assets/images/logo-icon.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/assets/images/logo-icon.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/assets/images/logo-icon.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: 'Live Queue', url: '/live', icons: [{ src: '/assets/icons/live.png' }] },
      { name: 'Podcasts', url: '/podcasts', icons: [{ src: '/assets/icons/pod.png' }] },
    ],
    // For deep + notifications
    prefer_related_applications: false,
  };
}