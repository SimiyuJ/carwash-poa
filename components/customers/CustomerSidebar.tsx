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
        router.replace("/customer/auth");
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

      router.replace("/customer/auth");
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
    <div className="overflow-hidden border border-red-500">
      <aside
        className={`
    fixed
    left-0
    top-0
    h-screen
    w-72
    flex
    flex-col
    bg-[#020817]
    z-[100]
    transition-transform
    duration-300

    ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}

    lg:${open ? "w-72" : "w-20"}
  `}
      >
        {/* HEADER */}
        <div className="shrink-0 p-5 border-b border-white/5">
          <button
            onClick={() => setOpen(!open)}
            className="
    h-10
    w-10
    shrink-0
    rounded-xl
    bg-cyan-500/10
    border
    border-cyan-500/20
    flex
    items-center
    justify-center
    text-cyan-400
  "
          >
            <Menu className="h-5 w-5" />
          </button>
          <div
            className={`
    rounded-3xl
    border
    border-cyan-500/10
    bg-gradient-to-br
    from-[#07142B]
    to-[#020817]
    ${open ? "p-5" : "p-3"}`}
          >
            <div
              className={`
                        flex
                        ${open ? "items-center gap-4" : "flex-col gap-3 items-center"}
                        `}
            >
              <div
                className="
          h-16
          w-16
          rounded-3xl
          bg-cyan-500/10
          flex
          items-center
          justify-center
        "
              >
                <Car className="h-8 w-8 text-cyan-400" />
              </div>

              {open && (
                <div>
                  <h3 className="text-xl font-black text-white">CUSTOMER</h3>

                  <p className="text-slate-400 text-sm truncate">
                    {activeBranch?.name}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="text-emerald-400 text-sm">
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
    mt-4
    ${open ? "w-full" : "w-12 mx-auto"}
    bg-cyan-500/10
    border
    border-cyan-500/20
    text-cyan-300
    hover:bg-cyan-500/20
  `}
          >
            {open ? "Switch Car Wash" : <Car className="h-5 w-5" />}
          </Button>
        </div>

        {/* NAVIGATION */}
        <nav
          className="
    flex-1
    overflow-y-auto
    px-4
    py-5
    space-y-2
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
          w-full
          flex
          items-center
          gap-4
          ${open ? "justify-start gap-4 px-4" : "justify-center"}
          rounded-2xl
          px-4
          py-4
          transition-all
          ${
            active
              ? `
                bg-gradient-to-r
                from-cyan-500
                to-sky-500
                text-white
                shadow-lg
                shadow-cyan-500/20
              `
              : `
                text-slate-300
                hover:bg-white/5
              `
          }
        `}
              >
                <Icon className="h-5 w-5" />

                {open && <span className="font-medium">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div
          className="
    shrink-0
    p-4
    border-t
    border-white/5
    bg-[#030B1D]
  "
        >
          <button
            onClick={handleLogout}
            className="
      w-full
      flex
      items-center
      justify-center
      gap-3
      rounded-3xl
      border
      border-red-500/20
      bg-red-500/10
      py-4
      text-red-400
      font-semibold
      hover:bg-red-500/20
      transition
    "
          >
            <LogOut className="h-5 w-5" />

            {open && "Logout"}
          </button>
        </div>
      </aside>
    </div>
  );
}
