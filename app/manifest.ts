import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CONNECT — Emmanuel Youth",
    short_name: "CONNECT",
    description: "Everything your youth ministry runs on, in one place.",
    start_url: "/home",
    display: "standalone",
    background_color: "#0B1440",
    theme_color: "#0B1440",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
