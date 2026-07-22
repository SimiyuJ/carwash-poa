import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",

    name: "WashFlow Pro",
    short_name: "WashFlow",

    description:
      "Enterprise Car Wash Management Platform for POS, Customers, Vehicles, Billing and Subscriptions.",

    start_url: "/",

    scope: "/",

    display: "standalone",

    display_override: ["window-controls-overlay", "standalone"],

    orientation: "portrait",

    background_color: "#020817",
    theme_color: "#06b6d4",

    lang: "en",
    dir: "ltr",

    categories: ["business", "productivity", "finance"],

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    screenshots: [
      {
        src: "/screenshots/dashboard.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/pos-mobile.png",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}
