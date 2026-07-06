import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { cn } from "@/lib/utils";

import AuthProvider from "@/components/providers/AuthProvider";
import IdleLogout from "@/components/IdleLogout";
import ServiceWorker from "@/components/ServiceWorker";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WashFlow Pro",

  description: "Professional Multi-Branch Carwash Management System",

  manifest: "/manifest",

  applicationName: "WashFlow Pro",

  keywords: [
    "Carwash",
    "POS",
    "WashFlow",
    "Inventory",
    "Subscriptions",
    "Carwash Management",
  ],

  themeColor: "#06b6d4",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WashFlow Pro",
  },

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark scroll-smooth", inter.className)}
    >
      <body
        className={cn(
          "min-h-screen",
          "bg-[#020617]",
          "text-white",
          "overflow-x-hidden",
          "font-sans",
          "antialiased",
        )}
      >
        <ServiceWorker />

        <IdleLogout />

        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
