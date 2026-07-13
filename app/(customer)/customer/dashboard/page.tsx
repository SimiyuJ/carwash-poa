"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";
import { supabase } from "@/lib/supabase";

import {
  User,
  Crown,
  Star,
  Car,
  CalendarCheck,
  CreditCard,
  Clock,
  Gift,
  Sparkles,
  Badge,
  ShieldCheck,
} from "lucide-react";

export default function CustomerDashboard() {
  const router = useRouter();

  const { activeBranch, isReady } = useActiveBranch();

  const [vehicles, setVehicles] = useState<any[]>([]);

  const [rewards, setRewards] = useState<any[]>([]);

  const [nextBooking, setNextBooking] = useState<any>(null);

  const [loyaltyProgress, setLoyaltyProgress] = useState(0);

  const [pointsRemaining, setPointsRemaining] = useState(0);

  useEffect(() => {
    if (!isReady) return;

    if (!activeBranch?.id) {
      router.replace("/customer/select-branch");
    }
  }, [activeBranch, isReady, router]);

  //laod dashboard
  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer } = await supabase
        .from("customers")
        .select(
          `
      id,
      loyalty_points,
      loyalty_level
    `,
        )
        .eq("profile_id", user.id)
        .eq("branch_id", activeBranch?.id)
        .maybeSingle();

      if (!customer) return;

      const customerId = customer.id;

      const { data: rewardsData } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("branch_id", activeBranch?.id)
        .eq("active", true);

      setRewards(rewardsData || []);

      const points = customer.loyalty_points || 0;

      let target = 500;

      if (points >= 500) target = 1000;

      if (points >= 1000) target = 2500;

      if (points >= 2500) target = 5000;

      const progress = Math.min((points / target) * 100, 100);

      setLoyaltyProgress(progress);

      setPointsRemaining(Math.max(target - points, 0));

      /*
       * PROFILE
       */
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      /*
       * CUSTOMER-CARWASH LINK
       */
      const { data: customerLink } = await supabase
        .from("customer_carwashes")
        .select("*")
        .eq("customer_id", customerId)
        .eq("carwash_id", activeBranch?.carwashId)
        .maybeSingle();

      /*
       * VEHICLES
       */
      const { data: vehicleData, count: vehicleCount } = await supabase
        .from("vehicles")
        .select("*", {
          count: "exact",
        })
        .eq("customer_id", customerId);

      setVehicles(vehicleData || []);

      /*
       * BOOKINGS
       */
      const {
        data: bookingData,
        count: bookingCount,
        error,
      } = await supabase
        .from("appointments")
        .select("*", {
          count: "exact",
        })
        .eq("customer_id", customerId)
        .eq("branch_id", activeBranch?.id)
        .order("appointment_date", {
          ascending: true,
        });

      setNextBooking(bookingData?.[0] || null);

      /*
       * INVOICES
       */
      const { count: invoiceCount } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("branch_id", activeBranch?.id)
        .eq("status", "Pending");

      //paid invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total")
        .eq("customer_id", customerId)
        .eq("carwash_id", activeBranch?.carwashId)
        .eq("status", "Paid");

      const totalSpent =
        invoices?.reduce(
          (sum, invoice) => sum + Number(invoice.total || 0),
          0,
        ) || 0;

      /*
       * SUBSCRIPTION
       */
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("customer_id", customerId)
        .eq("branch_id", activeBranch?.id)
        .maybeSingle();

      setStats({
        name: profile?.full_name || profile?.name || "Customer",

        membership: customer.loyalty_level || "Bronze",

        loyaltyPoints: customer.loyalty_points || 0,

        vehicles: vehicleCount ?? 0,

        washes: bookingCount ?? 0,

        activeBookings: bookingCount ?? 0,

        pendingInvoices: invoiceCount ?? 0,

        totalSpent,

        rewardsAvailable:
          rewardsData?.filter(
            (reward) => customer.loyalty_points >= reward.points_required,
          ).length || 0,

        subscription: subscription?.plan_name ?? "No Subscription",
      });
    } catch (error) {
      console.error("Dashboard load failed", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (!activeBranch?.id) return;

    loadDashboard();
  }, [activeBranch]);

  const [stats, setStats] = useState({
    name: "",
    membership: "Standard",
    loyaltyPoints: 0,

    vehicles: 0,
    washes: 0,
    activeBookings: 0,
    pendingInvoices: 0,

    totalSpent: 0,
    rewardsAvailable: 0,
    subscription: "None",
  });

  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const cardStyle = `
relative
overflow-hidden
rounded-3xl
border
border-cyan-500/10
bg-gradient-to-br
from-[#0C1B36]
via-[#112543]
to-[#0C1B36]
backdrop-blur-xl
shadow-[0_10px_30px_rgba(0,0,0,.25)]
transition-all
duration-300
hover:border-cyan-400/20
hover:shadow-[0_15px_40px_rgba(34,211,238,.08)]
`;

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!activeBranch?.id) {
    return null;
  }

  if (loadingDashboard) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div
      className="
    min-h-screen
    relative
    overflow-hidden
    bg-[#050B1A]
    text-white
    px-3
    py-4
    sm:px-5
    sm:py-6
    lg:px-8
    lg:py-8
  "
    >
      {/* Background ambient glow */}
      <div
        className="
      absolute
      inset-0
      pointer-events-none
      bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%)]
    "
      />

      <div
        className="
      absolute
      top-0
      right-0
      w-[500px]
      h-[500px]
      rounded-full
      bg-blue-500/10
      blur-3xl
      pointer-events-none
    "
      />

      <div
        className="
      relative
      mx-auto
      w-full
      max-w-[1440px]
      space-y-5
      lg:space-y-6
    "
      >
        {/* HERO */}

        <Card className="relative overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#07142B] via-[#0B1C39] to-[#06101F] shadow-[0_20px_60px_rgba(0,0,0,.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.15),transparent_35%)]" />

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />

          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className="
            flex h-14 w-14
            sm:h-16 sm:w-16
            lg:h-20 lg:w-20
            shrink-0
            items-center
            justify-center
            rounded-3xl
            border border-cyan-500/20
            bg-gradient-to-br
            from-cyan-500/20
            to-blue-600/10
            shadow-lg
            shadow-cyan-500/20
          "
                >
                  <User className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-cyan-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />

                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                      Customer Dashboard
                    </span>
                  </div>

                  <h1 className="mt-4 text-xl sm:text-3xl lg:text-4xl font-semibold text-slate-300">
                    Welcome back
                  </h1>

                  <h2 className="mt-1 break-words text-3xl sm:text-5xl lg:text-6xl font-black leading-tight text-white">
                    <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {stats.name}
                    </span>
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400">
                    Easily manage your vehicles, bookings, subscriptions and
                    loyalty rewards from one place.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full lg:w-auto lg:min-w-[340px]">
                <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-4 backdrop-blur-sm transition-all duration-300 hover:border-yellow-400/40 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-yellow-300">
                        Membership
                      </p>

                      <h3 className="mt-2 text-base sm:text-lg font-bold text-white truncate">
                        {stats.membership}
                      </h3>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/15">
                      <Crown className="h-5 w-5 text-yellow-400" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-cyan-300">
                        Loyalty
                      </p>

                      <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-black text-cyan-300">
                        {stats.loyaltyPoints}
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Available Points
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15">
                      <Gift className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PRIMARY STATS */}

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                Overview
              </p>

              <h2 className="mt-1 text-xl sm:text-2xl font-black text-white">
                Your Statistics
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Activity across your account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {/* Vehicles */}

            <Card className="group relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#071A30] to-[#08111F] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_45%)]" />

              <CardContent className="relative flex min-h-[125px] flex-col justify-between p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-cyan-500/10 p-2.5 ring-1 ring-cyan-500/20">
                    <Car className="h-5 w-5 text-cyan-400" />
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-cyan-300">
                    Vehicles
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {stats.vehicles}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">Registered</p>
                </div>
              </CardContent>
            </Card>

            {/* BOOKINGS */}

            <Card className="group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#081C1C] to-[#08111F] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.18),transparent_45%)]" />

              <CardContent className="relative flex min-h-[125px] flex-col justify-between p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-emerald-500/10 p-2.5 ring-1 ring-emerald-500/20">
                    <CalendarCheck className="h-5 w-5 text-emerald-400" />
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-emerald-300">
                    Bookings
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {stats.activeBookings}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">Active</p>
                </div>
              </CardContent>
            </Card>

            {/* WASHES */}

            <Card className="group relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-[#16132B] to-[#08111F] transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,.18),transparent_45%)]" />

              <CardContent className="relative flex min-h-[125px] flex-col justify-between p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-violet-500/10 p-2.5 ring-1 ring-violet-500/20">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-violet-300">
                    Washes
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {stats.washes}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">Completed</p>
                </div>
              </CardContent>
            </Card>

            {/* SPENT */}

            <Card className="group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#2A1C09] to-[#08111F] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,.18),transparent_45%)]" />

              <CardContent className="relative flex min-h-[125px] flex-col justify-between p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
                    <CreditCard className="h-5 w-5 text-amber-400" />
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-amber-300">
                    Spending
                  </span>
                </div>

                <div>
                  <h2 className="text-sm sm:text-xl lg:text-2xl font-black text-amber-300 leading-tight">
                    KES {stats.totalSpent.toLocaleString()}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">Lifetime Spend</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* MEMBERSHIP & REWARDS */}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Rewards & Membership
              </h2>

              <p className="text-xs sm:text-sm text-slate-400">
                Loyalty rewards and subscription overview
              </p>
            </div>

            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-400">
              Premium
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* LOYALTY */}

            <Card className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#0B172A] via-[#121826] to-[#08111F]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.18),transparent_45%)]" />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-yellow-400">
                      Loyalty Rewards
                    </p>

                    <h2 className="mt-2 text-4xl font-black text-white">
                      {stats.loyaltyPoints}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Available Reward Points
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10 shadow-lg shadow-yellow-500/10">
                    <Star className="h-7 w-7 text-yellow-400" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-slate-500">Progress</span>

                    <span className="font-semibold text-yellow-400">
                      {loyaltyProgress.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-cyan-400 to-blue-500 transition-all duration-700"
                      style={{
                        width: `${loyaltyProgress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-xs text-slate-500">Remaining</p>

                      <p className="font-bold text-white">{pointsRemaining}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500">Next Reward</p>

                      <p className="font-semibold text-cyan-400">Free Wash</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SUBSCRIPTION */}

            <Card className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#07142B] via-[#081C33] to-[#07111F]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_45%)]" />

              <CardContent className="relative flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400">
                      Subscription
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-cyan-400">
                      {stats.subscription}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Current Membership Plan
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 shadow-lg shadow-cyan-500/10">
                    <Crown className="h-7 w-7 text-cyan-400" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3">
                    <div>
                      <p className="text-xs text-slate-500">Status</p>

                      <p className="font-semibold text-white">Membership</p>
                    </div>

                    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      ACTIVE
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-xs text-slate-500">Benefits</p>

                      <p className="font-semibold text-white">
                        Priority Washes
                      </p>
                    </div>

                    <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* VEHICLES & BOOKINGS */}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Garage & Schedule
              </h2>

              <p className="text-xs sm:text-sm text-slate-400">
                Your registered vehicles and upcoming appointments
              </p>
            </div>

            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-400">
              Overview
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* VEHICLES */}

            <Card className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#07142B] via-[#0B172A] to-[#08111F]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_45%)]" />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400">
                      My Vehicles
                    </p>

                    <h2 className="mt-2 text-4xl font-black text-white">
                      {stats.vehicles}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Registered Vehicles
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 shadow-lg shadow-cyan-500/10">
                    <Car className="h-7 w-7 text-cyan-400" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-slate-500">Fleet Status</span>

                    <span className="font-semibold text-cyan-400">Active</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600"
                      style={{
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Total Registered</p>

                    <p className="font-semibold text-white">Vehicles</p>
                  </div>

                  <span className="text-2xl font-black text-cyan-400">
                    {stats.vehicles}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* BOOKINGS */}

            <Card className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#081922] via-[#0B172A] to-[#07111F]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.18),transparent_45%)]" />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-400">
                      Next Booking
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-white">
                      Upcoming
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Your next scheduled visit
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/10">
                    <CalendarCheck className="h-7 w-7 text-emerald-400" />
                  </div>
                </div>

                {nextBooking ? (
                  <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="font-bold text-lg text-white truncate">
                      {nextBooking.service}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock className="h-4 w-4 text-emerald-400" />
                        <span className="truncate">{nextBooking.date}</span>
                      </div>

                      <Badge className="bg-emerald-500/20 border-emerald-500/20 text-emerald-300">
                        Scheduled
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-center">
                    <CalendarCheck className="mx-auto h-10 w-10 text-slate-600" />

                    <p className="mt-3 font-semibold text-white">
                      No Upcoming Booking
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Schedule your next wash anytime.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* REWARDS CENTER */}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Rewards Center
              </h2>

              <p className="text-xs sm:text-sm text-slate-400">
                Redeem your loyalty points for exclusive benefits
              </p>
            </div>

            <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold text-purple-400">
              Rewards
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-[#0B1326] via-[#121826] to-[#08111F] shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,.18),transparent_45%)]" />

            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-purple-400">
                    Available Rewards
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-white">
                    {rewards.length}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Rewards ready for redemption
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-lg shadow-purple-500/10">
                  <Gift className="h-7 w-7 text-purple-400" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {rewards.length > 0 ? (
                  rewards.slice(0, 3).map((reward) => (
                    <div
                      key={reward.id}
                      className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 group-hover:scale-110 transition-transform">
                            <Gift className="h-5 w-5 text-purple-400" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-white">
                              {reward.title}
                            </h3>

                            <p className="text-xs text-slate-500">
                              Redeem with loyalty points
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
                            <span className="text-xs font-bold text-cyan-400">
                              {reward.points_required.toLocaleString()} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 py-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                      <Gift className="h-8 w-8 text-purple-400" />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-white">
                      No Rewards Available
                    </h3>

                    <p className="mt-2 max-w-sm mx-auto text-sm text-slate-500">
                      Continue visiting our carwash and earn loyalty points to
                      unlock exciting rewards and free services.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
