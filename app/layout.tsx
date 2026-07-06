import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { cn } from "@/lib/utils";

import AuthProvider from "@/components/providers/AuthProvider";
import IdleLogout from "@/components/IdleLogout";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "WashFlow Pro",
  description:
    "Professional Multi-Branch Carwash Management System",
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
      className={cn(
        "dark scroll-smooth",
        geist.variable
      )}
    >
      <body
        className={cn(
          "min-h-screen",
          "bg-[#020617]",
          "text-white",
          "overflow-x-hidden",
          "font-sans",
          "antialiased"
        )}
      >
        {/* AUTO LOGOUT */}
        <IdleLogout />

        {/* GLOBAL AUTH PROVIDER */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}