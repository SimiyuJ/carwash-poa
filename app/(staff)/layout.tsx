"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";

import { SidebarProvider, SidebarInset } from "@/components/sidebar";

import AppSidebar from "@/components/AppSidebar";

import Topbar from "@/components/Topbar";

import { getProfile } from "@/lib/getProfile";

import { permissions } from "@/lib/permissions";

/* =========================================
   DASHBOARD LAYOUT
========================================= */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const pathname = usePathname();

  const [loading, setLoading] = useState(true);

  const [authorized, setAuthorized] = useState(false);

  /* =========================================
     ROLE PROTECTION
  ========================================= */

  useEffect(() => {
    const protectRoute = async () => {
      try {
        setLoading(true);

        const profile = await getProfile();

        /* =========================================
           NOT LOGGED IN
        ========================================= */

        if (!profile) {
          router.replace("/auth");
          return;
        }

        /* =========================================
           GET USER ROLE
        ========================================= */

        const role = (
          profile.role || "customer"
        ).toLowerCase() as keyof typeof permissions;

        /* =========================================
           SAFE FALLBACK
        ========================================= */

        const allowedRoutes = permissions[role] || [];

        /* =========================================
           ROUTE CHECK
        ========================================= */

        const allowed = allowedRoutes.some((route) =>
          pathname.startsWith(route),
        );

        /* =========================================
           BLOCK ACCESS
        ========================================= */

        if (!allowed) {
          router.replace("/unauthorized");

          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Dashboard Layout Error:", error);

        router.replace("/auth");
      } finally {
        setLoading(false);
      }
    };

    protectRoute();
  }, [pathname, router]);

  /* =========================================
     LOADING SCREEN
  ========================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />

          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  /* =========================================
     BLOCK RENDER UNTIL AUTHORIZED
  ========================================= */

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />

          <p className="text-sm text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  /* =========================================
     DASHBOARD UI
  ========================================= */

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-[#020817]">
        {/* =========================================
          SIDEBAR
      ========================================= */}

        <AppSidebar />

        {/* =========================================
          RIGHT SIDE
      ========================================= */}

        <SidebarInset className="flex min-w-0 flex-1 flex-col bg-[#0B1120]">
          {/* =========================================
            TOPBAR
        ========================================= */}

          <header className="sticky top-0 z-30 w-full">
            <Topbar />
          </header>

          {/* =========================================
            PAGE CONTENT
        ========================================= */}

          <main className="flex-1 overflow-visible bg-[#0B1120] p-3 sm:p-4 md:p-6">
            <div className="mx-auto w-full max-w-none">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
