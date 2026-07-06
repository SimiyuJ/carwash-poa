"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  ShoppingCart,
  Car,
  Users,
  CalendarDays,
  Wrench,
  CreditCard,
  UserCog,
  Package,
  Receipt,
  BarChart3,
  Settings,
  ChevronRight,
  Sparkles,
  LogOut,
  Menu,
  X,
  Bell,
  ShieldCheck,
  Building2,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

/* ======================================================
   TYPES
====================================================== */

type Role = "admin" | "cashier" | "washer" | "manager";

type Branch = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  role: Role;
  tenant_id: string;
  branch_id?: string;
};

/* ======================================================
   NAVIGATION CONFIG
====================================================== */

const NAVIGATION = [
  {
    section: "MAIN",

    items: [
      {
        key: "dashboard",
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "manager"],
      },

      {
        key: "pos",
        title: "POS System",
        href: "/pos",
        icon: ShoppingCart,
        roles: ["admin", "cashier", "manager"],
      },

      {
        key: "customers",
        title: "Customers",
        href: "/customers",
        icon: Users,
        roles: ["admin", "manager", "cashier"],
      },

      {
        key: "queue",
        title: "Queue",
        href: "/queue",
        icon: Car,
        roles: ["admin", "manager", "washer"],
      },

      {
        key: "staff",
        title: "Staff",
        href: "/staff",
        icon: UserCheck,
        roles: ["admin", "manager", "washer"],
      },
    ],
  },

  {
    section: "OPERATIONS",

    items: [
      {
        key: "appointments",
        title: "Appointments",
        href: "/appointments",
        icon: CalendarDays,
        roles: ["admin", "manager"],
      },

      {
        key: "services",
        title: "Services",
        href: "/services",
        icon: Wrench,
        roles: ["admin", "manager"],
      },

      {
        key: "subscriptions",
        title: "Subscriptions",
        href: "/subscriptions",
        icon: CreditCard,
        roles: ["admin", "manager"],
      },
    ],
  },

  {
    section: "MANAGEMENT",

    items: [
      {
        key: "staff",
        title: "Staff",
        href: "/staff",
        icon: UserCog,
        roles: ["admin"],
      },

      {
        key: "inventory",
        title: "Inventory",
        href: "/inventory",
        icon: Package,
        roles: ["admin", "manager"],
      },

      {
        key: "expenses",
        title: "Expenses",
        href: "/expenses",
        icon: Receipt,
        roles: ["admin", "manager"],
      },

      {
        key: "reports",
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        roles: ["admin", "manager"],
      },

      {
        key: "settings",
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["admin", "manager"],
      },
    ],
  },
];

/* ======================================================
   COMPONENT
====================================================== */

function AppSidebar() {
  const pathname = usePathname();

  const [initialLoading, setInitialLoading] = useState(true);

  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const [userEmail, setUserEmail] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      setUserEmail(user.email || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileData) return;

      setProfile(profileData);
      setSelectedBranch(profileData.branch_id || "");

      const { data: branchData } = await supabase
        .from("branches")
        .select("id, name")
        .eq("tenant_id", profileData.tenant_id)
        .order("name");

      setBranches(branchData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     LOAD AUTH + TENANT + BRANCHES
  ====================================================== */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/auth");
          return;
        }

        setUserEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/auth");
          return;
        }

        if (!mounted) return;

        setUserEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileData) return;

        if (!mounted) return;

        setProfile(profileData);

        setSelectedBranch(profileData.branch_id || "");

        const { data: branchData } = await supabase
          .from("branches")
          .select("id, name")
          .eq("tenant_id", profileData.tenant_id)
          .order("name");

        if (!mounted) return;

        setBranches(branchData || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth");
        return;
      }

      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        refreshSidebarData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshSidebarData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    } catch (err) {
      console.error(err);
    }
  };

  /* ======================================================
     FILTER NAV
  ====================================================== */

  const filteredNavigation = useMemo(() => {
    if (!profile) return [];

    return NAVIGATION.map((section) => ({
      ...section,

      items: section.items.filter((item) => item.roles.includes(profile.role)),
    }));
  }, [profile]);

  /* ======================================================
     CLOSE MOBILE ON ROUTE CHANGE
  ====================================================== */

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* ======================================================
     LOGOUT
  ====================================================== */

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.replace("/auth");

    router.refresh();
  };

  /* ======================================================
     LOADING
  ====================================================== */

  if (initialLoading) {
    return (
      <div className="hidden lg:flex w-[290px] h-screen bg-[#020817] border-r border-white/5 items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <>
      {/* MOBILE TOPBAR */}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-[80] h-16 bg-[#020817]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>

            <div>
              <h1 className="font-black text-white text-sm">Nexus Car Wash</h1>

              <p className="text-xs text-cyan-400">Management Platform</p>
            </div>
          </div>
        </div>

        <button className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
          <Bell className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[90] bg-black/60 lg:hidden"
        />
      )}

      {/* SPACER */}

      <div
        className={`hidden lg:block transition-all duration-300 ${
          collapsed ? "w-[90px]" : "w-[290px]"
        }`}
      />

      {/* SIDEBAR */}

      <aside
        className={`
          fixed top-0 left-0 z-[100]
          h-screen bg-[#020817]
          border-r border-white/5
          transition-all duration-300
          flex flex-col

          ${collapsed ? "w-[90px]" : "w-[290px]"}

          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* HEADER */}

        <div className="h-[82px] border-b border-white/5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>

            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="font-black text-white truncate">
                  Nexus Car Wash
                </h2>

                <p className="text-xs text-cyan-400 truncate">
                  Management Platform
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden lg:flex h-10 w-10 rounded-2xl bg-white/5 border border-white/5 items-center justify-center"
          >
            {collapsed ? (
              <Menu className="h-4 w-4 text-white" />
            ) : (
              <X className="h-4 w-4 text-white" />
            )}
          </button>
        </div>

        {/* USER */}

        <div className="p-4 border-b border-white/5">
          <div className="rounded-3xl bg-[#081120] border border-white/5 p-4">
            <div
              className={`flex ${
                collapsed ? "justify-center" : "items-start gap-3"
              }`}
            >
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
              </div>

              {!collapsed && (
                <div className="overflow-hidden">
                  <h3 className="font-bold text-white truncate">
                    {profile?.role?.toUpperCase()}
                  </h3>

                  <p className="text-xs text-slate-400 truncate mt-1">
                    {userEmail}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                    <span className="text-xs text-emerald-400">
                      Active Session
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-8">
            {filteredNavigation.map(
              (section) =>
                section.items.length > 0 && (
                  <div key={section.section}>
                    {!collapsed && (
                      <p className="px-3 mb-3 text-[11px] font-bold tracking-[0.25em] text-cyan-400">
                        {section.section}
                      </p>
                    )}

                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const active =
                          pathname === item.href ||
                          pathname.startsWith(item.href + "/");

                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            className={`
                              group flex items-center
                              ${collapsed ? "justify-center" : "gap-3"}
                              rounded-2xl px-4 py-3
                              transition-all duration-200

                              ${
                                active
                                  ? "bg-cyan-500 text-white"
                                  : "text-slate-300 hover:bg-white/5 hover:text-white"
                              }
                            `}
                          >
                            <item.icon
                              className={`h-5 w-5 shrink-0 ${
                                active
                                  ? "text-white"
                                  : "text-slate-500 group-hover:text-cyan-400"
                              }`}
                            />

                            {!collapsed && (
                              <>
                                <span className="flex-1 truncate text-sm font-medium">
                                  {item.title}
                                </span>

                                {active && (
                                  <ChevronRight className="h-4 w-4 text-white/70" />
                                )}
                              </>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-2xl bg-red-500/10 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-3"
          >
            <LogOut className="h-5 w-5 shrink-0" />

            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default memo(AppSidebar);
