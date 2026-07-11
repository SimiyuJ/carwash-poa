"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Car,
  CreditCard,
  Star,
  Settings,
  Menu,
  LogOut,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

import {
  useActiveBranch,
  ActiveBranch,
} from "@/components/providers/ActiveBranchProvider";

const navItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/customer/dashboard",
  },
  {
    name: "Vehicles",
    icon: Car,
    path: "/customer/vehicles",
  },
  {
    name: "Services",
    icon: Car,
    path: "/customer/services",
  },
  {
    name: "Subscriptions",
    icon: CreditCard,
    path: "/customer/subscriptions",
  },
  {
    name: "Bookings",
    icon: Clock,
    path: "/customer/bookings",
  },
  {
    name: "Loyalty Points",
    icon: Star,
    path: "/customer/loyalty",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/customer/settings",
  },
];

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function CustomerSidebar({ open, setOpen }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { activeBranch, setActiveBranch, clearActiveBranch, isReady } =
    useActiveBranch();

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loadCustomerBranch = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          `
        branch_id,
        carwash_id
    `,
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      if (!profile?.branch_id) {
        router.replace("/customer/select-branch");
        return;
      }

      if (!activeBranch || activeBranch.id !== profile.branch_id) {
        setActiveBranch({
          id: profile.branch_id,
          name: activeBranch?.name ?? "Main Branch",
          carwashId: profile.carwash_id,
        });
      }
    } catch (error) {
      console.error("[CustomerSidebar] Unexpected error", error);
    } finally {
      setLoading(false);
    }
  }, [activeBranch, router, setActiveBranch]);

  useEffect(() => {
    if (!isReady) return;

    loadCustomerBranch();
  }, [isReady, loadCustomerBranch]);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024);
    };

    handleResize();
    setMounted(true);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      clearActiveBranch();
      await supabase.auth.signOut();

      router.replace("/auth");
    } catch (error) {
      console.error("[CustomerSidebar] Logout failed", error);
    }
  };

  if (!isReady || loading) {
    return (
      <div className="w-72 h-screen bg-[#0B1120] border-r border-slate-800 flex items-center justify-center text-slate-300">
        Loading...{" "}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="
          fixed
          inset-0
          bg-black/60
          backdrop-blur-sm
          z-40
          lg:hidden
        "
        />
      )}

      <aside
        className={`
        fixed
        left-0
        top-0
        z-50
        h-screen
        flex
        flex-col
        overflow-hidden

        bg-[#07142B]/95
        backdrop-blur-2xl

        border-r
        border-cyan-500/10

        shadow-2xl
        shadow-black/40

        transition-all
        duration-300

        ${
          open
            ? "translate-x-0 w-72"
            : "-translate-x-full lg:translate-x-0 lg:w-24"
        }
      `}
      >
        {/* ================= HEADER ================= */}

        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setOpen(!open)}
              className="
              h-11
              w-11
              rounded-2xl
              flex
              items-center
              justify-center

              bg-cyan-500/10
              border
              border-cyan-500/20

              text-cyan-400

              hover:bg-cyan-500/20
              transition
            "
            >
              <Menu className="h-5 w-5" />
            </button>

            {open && (
              <span className="text-xs uppercase tracking-[0.35em] text-cyan-400">
                Customer Portal
              </span>
            )}
          </div>

          <div
            className={`
            mt-5

            rounded-3xl

            bg-gradient-to-br
            from-cyan-500/10
            via-sky-500/5
            to-transparent

            border
            border-cyan-500/20

            transition-all

            ${open ? "p-5" : "p-3"}
          `}
          >
            <div
              className={`
              flex

              ${open ? "items-center gap-4" : "flex-col items-center gap-3"}
            `}
            >
              <div
                className="
                relative

                h-16
                w-16

                rounded-3xl

                bg-cyan-500/15

                border
                border-cyan-400/20

                flex
                items-center
                justify-center
              "
              >
                <Car className="h-8 w-8 text-cyan-400" />

                <span
                  className="
                  absolute
                  bottom-1
                  right-1

                  h-3
                  w-3

                  rounded-full
                  bg-emerald-400

                  ring-2
                  ring-[#07142B]
                "
                />
              </div>

              {open && (
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-lg text-white truncate">
                    CUSTOMER
                  </h3>

                  <p className="text-slate-400 text-sm truncate">
                    {activeBranch?.name}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="text-xs font-semibold text-emerald-400">
                      Active Session
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => router.push("/customer/select-branch")}
            className={`
            mt-5

            ${open ? "w-full" : "w-12 mx-auto"}

            rounded-2xl

            bg-cyan-500/10

            border
            border-cyan-500/20

            hover:bg-cyan-500/20

            text-cyan-300
          `}
          >
            {open ? (
              <>
                <Car className="mr-2 h-4 w-4" />
                Switch Car Wash
              </>
            ) : (
              <Car className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* ================= NAVIGATION ================= */}

        <nav
          className="
    
          flex-1
    
          overflow-y-auto
          px-4
          py-5
          space-y-2
          pb-28
          "
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            const active = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`
                group
                relative

                flex
                items-center

                w-full

                ${open ? "justify-start gap-4 px-4" : "justify-center px-0"}

                py-4

                rounded-2xl

                transition-all
                duration-300

                ${
                  active
                    ? `
                        bg-gradient-to-r
                        from-cyan-500
                        to-sky-500

                        text-white

                        shadow-xl
                        shadow-cyan-500/20
                      `
                    : `
                        text-slate-300

                        hover:bg-white/5

                        hover:text-cyan-300
                      `
                }
              `}
              >
                {active && (
                  <div
                    className="
                    absolute
                    left-0
                    top-3
                    bottom-3

                    w-1

                    rounded-full

                    bg-white
                  "
                  />
                )}

                <Icon
                  className={`
                  h-5
                  w-5

                  ${active ? "text-white" : "group-hover:text-cyan-400"}
                `}
                />

                {open && <span className="font-medium">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* ================= FOOTER ================= */}

        <div
          className="
          shrink-0
          sticky
          bottom-0
          bg-[#07142B]
          border-t
          border-cyan-500/10
          p-4
          "
        >
          <button
            onClick={handleLogout}
            className="
    flex
    items-center
    justify-center
    gap-3

    w-full
    h-14

    rounded-2xl

    bg-gradient-to-r
    from-red-500/15
    to-red-600/10

    border
    border-red-500/20

    text-red-400

    font-semibold

    shadow-lg
    shadow-red-900/20

    hover:from-red-500/25
    hover:to-red-600/20

    transition-all
  "
          >
            <LogOut className="h-5 w-5" />

            {open && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
