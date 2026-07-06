"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Plus,
  User,
  Bell,
  Search,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ========================= TYPES ========================= */

type Profile = {
  id: string;
  role: string;
  tenant_id: string;   // carwash_id
  branch_id: string;
};

type DashboardStats = {
  vehiclesInQueue: number;
  todayRevenue: number;
  pendingAppointments: number;
  activeOrders: number;
  unpaidInvoices: number;
  totalCustomers: number;
};

type SearchResult = {
  id: string;
  plate_number?: string;
  customer_name?: string;
};

/* ========================= COMPONENT ========================= */

export default function Topbar() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    vehiclesInQueue: 0,
    todayRevenue: 0,
    pendingAppointments: 0,
    activeOrders: 0,
    unpaidInvoices: 0,
    totalCustomers: 0,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /* ========================= LOAD PROFILE (CARWASH + BRANCH) ========================= */

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, role, tenant_id, branch_id")
      .eq("id", user.id)
      .single();

    setProfile(data);
  }, [router]);

  /* ========================= LOAD DASHBOARD ========================= */

  const loadDashboardData = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];

      const [
        vehiclesRes,
        invoicesRes,
        appointmentsRes,
        ordersRes,
        customersRes,
      ] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id")
          .eq("tenant_id", profile.tenant_id)
          .eq("branch_id", profile.branch_id),

        supabase
          .from("invoices")
          .select("id,total,payment_status,created_at")
          .eq("tenant_id", profile.tenant_id)
          .eq("branch_id", profile.branch_id)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`),

        supabase
          .from("appointments")
          .select("id")
          .eq("tenant_id", profile.tenant_id)
          .eq("branch_id", profile.branch_id)
          .eq("status", "pending"),

        supabase
          .from("orders")
          .select("id")
          .eq("tenant_id", profile.tenant_id)
          .eq("branch_id", profile.branch_id)
          .in("status", ["pending", "processing", "washing"]),

        supabase
          .from("customers")
          .select("id")
          .eq("tenant_id", profile.tenant_id),
      ]);

      const invoices = invoicesRes.data ?? [];

      const paid = invoices.filter(
        (i: any) => String(i.payment_status).toUpperCase() === "PAID"
      );

      const unpaid = invoices.filter(
        (i: any) => String(i.payment_status).toUpperCase() !== "PAID"
      );

      const revenue = paid.reduce(
        (sum, i) => sum + Number(i.total || 0),
        0
      );

      setStats({
        vehiclesInQueue: vehiclesRes.data?.length ?? 0,
        todayRevenue: revenue,
        pendingAppointments: appointmentsRes.data?.length ?? 0,
        activeOrders: ordersRes.data?.length ?? 0,
        unpaidInvoices: unpaid.length,
        totalCustomers: customersRes.data?.length ?? 0,
      });

      setNotifications([
        ...(unpaid.length
          ? [{ id: 1, title: `${unpaid.length} unpaid invoices` }]
          : []),

        ...(appointmentsRes.data?.length
          ? [{ id: 2, title: `${appointmentsRes.data.length} pending appointments` }]
          : []),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  /* ========================= INIT ========================= */

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) loadDashboardData();
  }, [profile, loadDashboardData]);

  /* ========================= REALTIME (SAFE DEBOUNCE) ========================= */

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel("topbar-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(loadDashboardData, 300);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(loadDashboardData, 300);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(loadDashboardData, 300);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, loadDashboardData]);

  /* ========================= SEARCH ========================= */

  useEffect(() => {
    if (!profile) return;

    if (!search.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id,plate_number,customer_name")
        .eq("tenant_id", profile.tenant_id)
        .eq("branch_id", profile.branch_id)
        .or(
          `plate_number.ilike.%${search}%,customer_name.ilike.%${search}%`
        )
        .limit(8);

      setSearchResults(data || []);
      setShowSearchResults(true);
    }, 300);

    return () => clearTimeout(t);
  }, [search, profile]);

  /* ========================= CLICK OUTSIDE ========================= */

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ========================= LOGOUT ========================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const userName = useMemo(() => profile?.role ?? "User", [profile]);

  /* ========================= UI ========================= */

  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020617]/90 backdrop-blur-xl px-4 py-4">
      <div className="flex items-center justify-between gap-4">

        <Button
          onClick={() => router.push("/pos")}
          className="hidden sm:flex bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>

        {/* SEARCH */}
        <div className="flex-1 relative" ref={searchRef}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 rounded-2xl bg-[#0B1220] border border-white/10 pl-4 text-white"
            placeholder="Search vehicles..."
          />

          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-14 left-0 right-0 bg-[#081120] border border-white/10 rounded-2xl">
              {searchResults.map((v) => (
                <button
                  key={v.id}
                  onClick={() => router.push(`/vehicles/${v.id}`)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5"
                >
                  <p className="text-white">{v.plate_number}</p>
                  <p className="text-gray-400 text-sm">{v.customer_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          <button
            onClick={() => router.push("/appointments")}
            className="relative h-11 w-11 bg-white/5 rounded-2xl flex items-center justify-center"
          >
            <Bell className="h-5 w-5 text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                {notifications.length}
              </span>
            )}
          </button>

          <div ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-2xl"
            >
              <User className="h-5 w-5 text-cyan-400" />
              <span className="text-white">{userName}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {open && (
              <div className="absolute right-4 mt-3 w-64 bg-[#081120] border border-white/10 rounded-2xl">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}