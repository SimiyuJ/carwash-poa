import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "sonner";

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

        <AuthProvider>
          {children}

          <Toaster
            position="top-center"
            richColors
            closeButton
            expand
            duration={3500}
            theme="dark"
            toastOptions={{
              className:
                "!bg-[#07142B] !border !border-cyan-500/20 !text-white !rounded-3xl !shadow-[0_20px_60px_rgba(0,0,0,.45)]",
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
