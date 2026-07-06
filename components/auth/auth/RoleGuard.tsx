"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ShieldX, Loader2 } from "lucide-react";

import { getProfile, type UserRole } from "@/lib/getProfile";

import { Card, CardContent } from "@/components/ui/card";

/* =========================================
   TYPES
========================================= */

interface RoleGuardProps {
  allow: UserRole[];
  children: React.ReactNode;
}

/* =========================================
   COMPONENT
========================================= */

export default function RoleGuard({ allow, children }: RoleGuardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [allowed, setAllowed] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  /* =========================================
     CHECK ACCESS
  ========================================= */

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      try {
        setLoading(true);

        const userProfile = await getProfile();

        /* =========================================
           NO PROFILE
        ========================================= */

        if (!userProfile) {
          console.warn("NO PROFILE FOUND");

          router.replace("/auth");

          return;
        }

        if (!mounted) return;

        setProfile(userProfile);

        /* =========================================
           ROLE CHECK
        ========================================= */

        const hasAccess = allow.includes(userProfile.role);

        if (!hasAccess) {
          console.warn("ACCESS DENIED FOR ROLE:", userProfile.role);

          /*
            CUSTOMER REDIRECT
          */

          if (userProfile.role === "customer") {
            router.replace("/customer-profiles/dashboard");

            return;
          }

          /*
            STAFF REDIRECT
          */

          router.replace("/unauthorized");

          return;
        }

        setAllowed(true);
      } catch (error: any) {
        console.error("ROLE GUARD ERROR:", error?.message || error);

        router.replace("/auth");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkRole();

    return () => {
      mounted = false;
    };
  }, [allow, router]);

  /* =========================================
     LOADING SCREEN
  ========================================= */

  if (loading) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-[#020817]
          p-6
        "
      >
        <Card
          className="
            w-full
            max-w-md
            rounded-3xl
            border
            border-white/10
            bg-[#0B1120]
            shadow-2xl
          "
        >
          <CardContent
            className="
              p-10
              flex
              flex-col
              items-center
              justify-center
              text-center
              space-y-5
            "
          >
            <div
              className="
                w-16
                h-16
                rounded-full
                bg-cyan-500/10
                flex
                items-center
                justify-center
              "
            >
              <Loader2
                className="
                  w-8
                  h-8
                  animate-spin
                  text-cyan-400
                "
              />
            </div>

            <div>
              <h2
                className="
                  text-2xl
                  font-bold
                  text-white
                "
              >
                Checking Permissions
              </h2>

              <p
                className="
                  text-gray-400
                  mt-2
                "
              >
                Verifying your access rights...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================================
     ACCESS DENIED
  ========================================= */

  if (!allowed) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-[#020817]
          p-6
        "
      >
        <Card
          className="
            w-full
            max-w-md
            rounded-3xl
            border
            border-red-500/20
            bg-[#0B1120]
            shadow-2xl
          "
        >
          <CardContent
            className="
              p-10
              flex
              flex-col
              items-center
              text-center
              space-y-5
            "
          >
            <div
              className="
                w-16
                h-16
                rounded-full
                bg-red-500/10
                flex
                items-center
                justify-center
              "
            >
              <ShieldX
                className="
                  w-8
                  h-8
                  text-red-500
                "
              />
            </div>

            <div>
              <h2
                className="
                  text-2xl
                  font-bold
                  text-white
                "
              >
                Access Denied
              </h2>

              <p
                className="
                  text-gray-400
                  mt-2
                "
              >
                You do not have permission to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================================
     RENDER PAGE
  ========================================= */

  return <>{children}</>;
}
