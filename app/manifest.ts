import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WashFlow Pro",
    short_name: "WashFlow",
    description: "Enterprise Carwash Management Platform",

    start_url: "/",
    scope: "/",

    display: "standalone",

    background_color: "#020817",
    theme_color: "#06b6d4",

    orientation: "portrait",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
