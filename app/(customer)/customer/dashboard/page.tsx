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
    bg-gradient-to-br
    from-[#07142B]
    via-[#081A33]
    to-[#07142B]
    text-white
    px-3
    py-4
    sm:px-4
    sm:py-5
    lg:px-6
    lg:py-6
  "
    >
      <div
        className="
      mx-auto
      w-full
      max-w-7xl
      space-y-4
      lg:space-y-5
    "
      >
        {/* HERO */}

        <Card className="relative overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#07142B] via-[#0A1D3D] to-[#07142B] shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_40%)]" />

          <CardContent className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">
              {/* LEFT SIDE */}
              <div className="flex items-center gap-3 sm:gap-3 min-w-0">
                <div
                  className="
            h-12
            w-12
            sm:h-14
            sm:w-14
            lg:h-16
            lg:w-16
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            flex
            items-center
            justify-center
            shrink-0
          "
                >
                  <User className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-cyan-400" />
                </div>

                <div className="min-w-0">
                  <p className="uppercase tracking-[2px] sm:tracking-[4px] text-[10px] sm:text-xs font-semibold text-cyan-400">
                    Customer Dashboard
                  </p>

                  <h1 className="mt-1 text-xl sm:text-3xl lg:text-5xl font-bold leading-tight">
                    Welcome back,
                  </h1>

                  <h2 className="truncate text-2xl sm:text-4xl lg:text-6xl font-black text-cyan-400 leading-tight">
                    {stats.name}
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm lg:text-base text-slate-400 max-w-xl">
                    Manage vehicles, bookings, rewards and subscriptions.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="grid w-full lg:w-auto grid-cols-2 gap-3 sm:gap-4 lg:min-w-[330px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-4 lg:p-5">
                  <p className="text-[11px] sm:text-sm text-slate-400">
                    Membership
                  </p>

                  <div className="flex items-center gap-2 mt-2 sm:mt-3">
                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />

                    <span className="text-sm sm:text-base font-bold text-yellow-400 truncate">
                      {stats.membership}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-4 lg:p-5">
                  <p className="text-[11px] sm:text-sm text-slate-400">
                    Loyalty Points
                  </p>

                  <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-cyan-400 leading-none">
                    {stats.loyaltyPoints}
                  </h2>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PRIMARY STATS */}

        <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-3">
          {/* Vehicles */}
          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.12),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                    Vehicles
                  </p>

                  <h2 className="mt-1 text-lg sm:text-2xl lg:text-4xl font-black leading-none">
                    {stats.vehicles}
                  </h2>
                </div>

                <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings */}
          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.12),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                    Bookings
                  </p>

                  <h2 className="mt-1 text-lg sm:text-2xl lg:text-4xl font-black leading-none">
                    {stats.activeBookings}
                  </h2>
                </div>

                <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Washes */}
          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,.12),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                    Washes
                  </p>

                  <h2 className="mt-1 text-lg sm:text-2xl lg:text-4xl font-black leading-none">
                    {stats.washes}
                  </h2>
                </div>

                <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Spent */}
          <Card
            className={`${cardStyle} border-emerald-500/20 overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.16),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                    Spent
                  </p>

                  <h2 className="mt-1 text-sm sm:text-xl lg:text-3xl font-black text-emerald-400 leading-none truncate">
                    KES {stats.totalSpent.toLocaleString()}
                  </h2>
                </div>

                <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MAIN GRID */}
        {/* LOYALTY + SUBSCRIPTION */}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-3">
          {/* Loyalty */}
          <Card
            className={`${cardStyle} col-span-1 xl:col-span-1 overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">
                    Loyalty
                  </p>

                  <h2 className="mt-1 text-lg sm:text-2xl lg:text-3xl font-black">
                    {stats.loyaltyPoints}
                  </h2>

                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                    Available Points
                  </p>
                </div>

                <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
              </div>

              <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 transition-all duration-500"
                  style={{
                    width: `${loyaltyProgress}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-slate-500">
                  {loyaltyProgress.toFixed(0)}%
                </span>

                <span className="text-cyan-400 font-medium">
                  {pointsRemaining} pts left
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5 h-full">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">
                    Subscription
                  </p>

                  <h2 className="mt-2 text-base sm:text-xl lg:text-2xl font-black text-cyan-400 truncate">
                    {stats.subscription}
                  </h2>

                  <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                    Active Membership
                  </p>
                </div>

                <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 text-cyan-400" />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    Status
                  </span>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] sm:text-xs font-semibold text-emerald-400">
                    ACTIVE
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* VEHICLES + BOOKINGS */}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-3">
          {/* Vehicles */}
          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">
                    Vehicles
                  </p>

                  <h2 className="mt-2 text-2xl sm:text-3xl lg:text-5xl font-black leading-none">
                    {stats.vehicles}
                  </h2>

                  <p className="mt-2 text-[11px] sm:text-xs text-slate-400">
                    Registered Vehicles
                  </p>
                </div>

                <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 text-cyan-400" />
                </div>
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Booking */}
          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.14),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">
                    Booking
                  </p>

                  <h2 className="mt-2 text-base sm:text-lg lg:text-xl font-black">
                    Upcoming
                  </h2>
                </div>

                <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CalendarCheck className="h-5 w-5 text-emerald-400" />
                </div>
              </div>

              {nextBooking ? (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="font-semibold text-sm sm:text-base truncate">
                    {nextBooking.service}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[11px] sm:text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />

                    <span className="truncate">{nextBooking.date}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-3">
                  <p className="text-[11px] sm:text-sm text-slate-500">
                    No upcoming bookings.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* REWARDS */}

        {/* REWARDS */}

        <Card className={`${cardStyle} overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,.14),transparent_45%)]" />

          <CardContent className="relative p-3 sm:p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">
                  Rewards
                </p>

                <h2 className="mt-1 text-lg sm:text-xl lg:text-2xl font-black">
                  Available
                </h2>
              </div>

              <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl border border-purple-500/20 bg-purple-500/10 flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5 text-purple-400" />
              </div>
            </div>

            <div className="space-y-2.5">
              {rewards.length > 0 ? (
                rewards.slice(0, 3).map((reward) => (
                  <div
                    key={reward.id}
                    className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-white/10
              bg-white/5
              backdrop-blur-sm
              px-3
              py-3
              transition-all
              duration-200
              hover:border-cyan-500/30
              hover:bg-cyan-500/5
            "
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Gift className="h-4 w-4 text-purple-400" />
                      </div>

                      <span className="text-sm sm:text-base font-medium truncate">
                        {reward.title}
                      </span>
                    </div>

                    <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-cyan-400">
                      {reward.points_required} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-4 text-center">
                  <Gift className="mx-auto h-6 w-6 text-slate-500 mb-2" />
                  <p className="text-sm text-slate-500">
                    No rewards available yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
