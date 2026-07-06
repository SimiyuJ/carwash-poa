"use client";

import { useEffect, useState } from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Menu,
  X,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import AppSidebar from "@/components/AppSidebar";
import Topbar from "@/components/Topbar";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

const allowedRoles = [
  "admin",
  "manager",
  "cashier",
  "washer",
  "customer",
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [session, setSession] =
    useState<any>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  /* =========================================
     PUBLIC ROUTES
  ========================================= */

  const publicRoutes = [
    "/auth",
    "/login",
    "/signup",
    "/register",
    "/customer-profiles/auth",
  ];

  const isPublicRoute =
    publicRoutes.includes(pathname);

  /* =========================================
     AUTH CHECK
  ========================================= */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        /* =====================================
           ALLOW PUBLIC ROUTES
        ===================================== */

        if (isPublicRoute) {
          setLoading(false);
          return;
        }

        setLoading(true);

        /* =====================================
           GET SESSION
        ===================================== */

        const {
          data: { session },
          error,
        } =
          await supabase.auth.getSession();

        console.log(
          "SESSION:",
          session
        );

        if (error) {
          console.error(
            "SESSION ERROR:",
            error.message
          );
        }

        /* =====================================
           NO SESSION
        ===================================== */

        if (!session?.user) {
          router.replace("/auth");

          return;
        }

        if (!mounted) return;

        setSession(session);

        /* =====================================
           GET PROFILE
        ===================================== */

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        console.log(
          "PROFILE:",
          profileData
        );

        if (
          profileError ||
          !profileData
        ) {
          console.error(
            "PROFILE ERROR:",
            profileError
          );

          setLoading(false);

          return;
        }

        if (!mounted) return;

        setProfile(profileData);

        /* =====================================
           CUSTOMER REDIRECT
        ===================================== */

        if (
          profileData.role ===
          "customer"
        ) {
          if (
            !pathname.startsWith(
              "/customer-profiles"
            )
          ) {
            router.replace(
              "/customer-profiles/dashboard"
            );
          }

          return;
        }

        /* =====================================
           INVALID ROLE
        ===================================== */

        if (
          !allowedRoles.includes(
            profileData.role
          )
        ) {
          router.replace(
            "/unauthorized"
          );

          return;
        }
      } catch (error) {
        console.error(
          "LAYOUT ERROR:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    /* =========================================
       AUTH LISTENER
    ========================================= */

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log(
            "AUTH EVENT:",
            event
          );

          setSession(session);

          /* =====================================
             SIGNED OUT
          ===================================== */

          if (
            event === "SIGNED_OUT"
          ) {
            router.replace("/auth");
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, [
    pathname,
    router,
    isPublicRoute,
  ]);

  /* =========================================
     LOADING SCREEN
  ========================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />

          <span className="text-lg">
            Loading application...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================
     PUBLIC PAGES
  ========================================= */

  if (isPublicRoute) {
    return <>{children}</>;
  }

  /* =========================================
     NO SESSION
  ========================================= */

  if (!session) {
    return null;
  }

  /* =========================================
     MAIN LAYOUT
  ========================================= */

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020817]">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-[280px]
          bg-[#020817]
          border-r border-white/10
          overflow-visible
          transition-transform duration-300

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >
        {/* MOBILE CLOSE */}

        <div className="flex items-center justify-end p-4 lg:hidden">
          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="
              rounded-xl
              border border-white/10
              p-2
              text-white
              hover:bg-white/10
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AppSidebar />
      </aside>

      {/* MAIN CONTENT */}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[280px]">
        {/* MOBILE TOPBAR */}

        <div className="flex items-center gap-3 border-b border-white/10 bg-[#020817] px-4 py-3 lg:hidden">
          <button
            onClick={() =>
              setSidebarOpen(true)
            }
            className="
              rounded-xl
              border border-white/10
              bg-white/5
              p-2
              text-white
            "
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-white">
              WashPOS
            </h1>

            <p className="text-xs text-gray-400">
              {profile?.role}
            </p>
          </div>
        </div>

        {/* TOPBAR */}

        <Topbar />

        {/* PAGE */}

        <main
          className="
            flex-1
            overflow-y-auto
            bg-[#0B1120]
            p-3
            sm:p-4
            md:p-6
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}