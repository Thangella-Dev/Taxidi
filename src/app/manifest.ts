import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taxiro - Predictive Bike Taxi App",
    short_name: "Taxiro",
    description:
      "Map-first bike taxi booking for India with ready signals, live rider tracking, private ride codes, and transparent rider earnings.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    background_color: "#eef3ec",
    theme_color: "#101713",
    orientation: "portrait",
    categories: ["travel", "navigation", "productivity", "utilities"],
    lang: "en-IN",
    dir: "ltr",
    icons: [
      {
        src: "/icons/taxiro-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/taxiro-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/taxiro-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/taxiro-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Book a ride",
        short_name: "Book",
        description: "Open Taxiro user booking",
        url: "/dashboard/user",
        icons: [{ src: "/icons/taxiro-icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Rider mode",
        short_name: "Rider",
        description: "Open Taxiro rider workspace",
        url: "/dashboard/rider",
        icons: [{ src: "/icons/taxiro-icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
