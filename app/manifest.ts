import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Colony — Truth. Faith. Freedom.",
    short_name: "The Colony",
    description:
      "Elite, AI-native conservative & Christian streaming. Live + on-demand, ad-free, private.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1712",
    theme_color: "#1a1712",
    orientation: "portrait",
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
  };
}