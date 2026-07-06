"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveBranch }
  from "@/components/providers/ActiveBranchProvider";
import { supabase } from "@/lib/supabase";

import {
  User,
  Crown,
  Star,
  Car,
  CalendarCheck,
  CreditCard,
  Gift,
  Wallet,
  Plus,
  Bell,
  Sparkles,
  Shield,
} from "lucide-react";

export default function CustomerDashboard() {
  const router = useRouter();

  const {
    activeBranch,
    isReady,
  } = useActiveBranch();

  const [vehicles, setVehicles] = useState<any[]>([]);

  const [rewards, setRewards] = useState<any[]>([]);

  const [nextBooking, setNextBooking] =
    useState<any>(null);

  const [loyaltyProgress, setLoyaltyProgress] =
    useState(0);

  const [pointsRemaining, setPointsRemaining] =
    useState(0);
    


  useEffect(() => {
    if (!isReady) return;

    console.log("Dashboard Active Carwash:", activeBranch);

    if (!activeBranch?.id) {
      console.log(
        "No active carwash -> redirecting to selector"
      );

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

      const { data: customer } =
        await supabase
          .from("customers")
          .select(`
      id,
      loyalty_points,
      loyalty_level
    `)
          .eq("profile_id", user.id)
          .eq("branch_id", activeBranch?.id)
          .maybeSingle()

      if (!customer) return;

      const customerId = customer.id;
      console.log("CUSTOMER RECORD:", customer);
      console.log("CUSTOMER ID USED:", customerId);

      console.log(
        "Loading dashboard for carwash:",
        activeBranch?.id
      );

      const { data: rewardsData } =
        await supabase
          .from("loyalty_rewards")
          .select("*")
          .eq("branch_id", activeBranch?.id)
          .eq("active", true)

      setRewards(rewardsData || []);

      const points =
        customer.loyalty_points || 0;

      let target = 500;

      if (points >= 500)
        target = 1000;

      if (points >= 1000)
        target = 2500;

      if (points >= 2500)
        target = 5000;

      const progress =
        Math.min(
          (points / target) * 100,
          100
        );

      setLoyaltyProgress(progress);

      setPointsRemaining(
        Math.max(
          target - points,
          0
        )
      );

      /*
 * PROFILE
 */
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("PROFILE:", profile);

      /*
       * CUSTOMER-CARWASH LINK
       */
      console.log("CUSTOMER ID:", customerId);
      console.log("ACTIVE BRANCH:", activeBranch);
      console.log("ACTIVE BRANCH ID:", activeBranch?.id);
      const { data: customerLink } = await supabase
        .from("customer_carwashes")
        .select("*")
        .eq("customer_id", customerId)
        .eq("carwash_id", activeBranch?.carwashId)
        .maybeSingle();

      console.log("CUSTOMER LINK:", customerLink);

      /*
       * VEHICLES
       */
      const {
        data: vehicleData,
        count: vehicleCount,
      } = await supabase
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

      console.log("APPOINTMENTS:", bookingData);
      console.log("APPOINTMENTS ERROR:", error);


      setNextBooking(
        bookingData?.[0] || null
      );

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
      const {
        data: invoices,
      } = await supabase
        .from("invoices")
        .select("total")
        .eq("customer_id", customerId)
        .eq("carwash_id", activeBranch?.carwashId)
        .eq("status", "Paid");

      const totalSpent =
        invoices?.reduce(
          (sum, invoice) =>
            sum +
            Number(
              invoice.total || 0
            ),
          0
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
        name:
          profile?.full_name ||
          profile?.name ||
          "Customer",

        membership:
          customer.loyalty_level ||
          "Bronze",

        loyaltyPoints:
          customer.loyalty_points || 0,

        vehicles: vehicleCount ?? 0,

        washes: bookingCount ?? 0,

        activeBookings: bookingCount ?? 0,

        pendingInvoices: invoiceCount ?? 0,

        totalSpent,

        rewardsAvailable:
          rewardsData?.filter(
            reward =>
              customer.loyalty_points >=
              reward.points_required
          ).length || 0,

        subscription:
          subscription?.plan_name ??
          "No Subscription",
      });
    } catch (error) {
      console.error(
        "Dashboard load failed",
        error
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    console.log(
      "BRANCH CHANGED:",
      activeBranch
    );

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

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const cardStyle = `
relative
overflow-hidden
rounded-[28px]
border
border-white/[0.08]
bg-gradient-to-br
from-[#081528]
via-[#0B1E3F]
to-[#07142B]
backdrop-blur-xl
shadow-[0_20px_60px_rgba(0,0,0,0.45)]
transition-all
duration-500
hover:-translate-y-1
hover:border-cyan-400/20
hover:shadow-[0_25px_80px_rgba(6,182,212,0.18)]
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
        <div className="text-cyan-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">

      {/* HERO */}

      <Card className="relative overflow-hidden rounded-[32px] border border-cyan-500/10 bg-gradient-to-br from-[#07142B] via-[#0A1D3D] to-[#07142B]">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_40%)]" />

        <CardContent className="relative p-6 lg:p-8">

          <div className="flex flex-col xl:flex-row justify-between gap-8">

            <div className="flex gap-5 items-center">

              <div className="
              h-16
              w-16
              rounded-2xl
              bg-cyan-500/10
              border
              border-cyan-500/20
              flex
              items-center
              justify-center
              ">

                <User className="h-8 w-8 text-cyan-400" />

              </div>

              <div>

                <p className="uppercase tracking-[4px] text-cyan-400 font-semibold">
                  Customer Dashboard
                </p>

                <h1 className="text-3xl lg:text-5xl font-bold">
                  Welcome back,
                </h1>

                <h2 className="text-4xl lg:text-6xl font-black text-cyan-400">
                  {stats.name}
                </h2>

                <p className="text-slate-400 mt-3">
                  Manage vehicles, bookings, rewards and subscriptions.
                </p>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[320px]">

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

                <p className="text-slate-400 text-sm">
                  Membership
                </p>

                <div className="flex items-center gap-2 mt-3">

                  <Crown className="h-5 w-5 text-yellow-400" />

                  <span className="font-bold text-yellow-400">
                    {stats.membership}
                  </span>

                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

                <p className="text-slate-400 text-sm">
                  Loyalty Points
                </p>

                <h2 className="text-3xl font-black text-cyan-400 mt-2">
                  {stats.loyaltyPoints}
                </h2>

              </div>

            </div>

          </div>

        </CardContent>

      </Card>

      {/* PRIMARY STATS */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

        <Card className={cardStyle}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.12),transparent_45%)]" />
          <CardContent className="relative p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-slate-500">Vehicles</p>
                <h2 className="text-4xl font-black">
                  {stats.vehicles}
                </h2>
              </div>
              <Car className="text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyle}>
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-slate-500">Bookings</p>
                <h2 className="text-4xl font-black">
                  {stats.activeBookings}
                </h2>
              </div>
              <CalendarCheck className="text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyle}>
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-slate-500">Washes</p>
                <h2 className="text-4xl font-black">
                  {stats.washes}
                </h2>
              </div>
              <Sparkles className="text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${cardStyle} border-emerald-500/15`}>
          <CardContent className="relative p-6">

            <div className="
      absolute
      inset-0
      bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.15),transparent_45%)]
    " />

            <div className="relative flex justify-between items-start">

              <div>

                <p className="text-slate-400 text-sm uppercase tracking-wider">
                  Total Spent
                </p>

                <h2 className="
          mt-3
          text-4xl
          lg:text-5xl
          font-black
          text-emerald-400
        ">
                  KES {stats.totalSpent.toLocaleString()}
                </h2>

              </div>

              <div className="
        h-14
        w-14
        rounded-2xl
        bg-emerald-500/10
        border
        border-emerald-500/20
        flex
        items-center
        justify-center
      ">
                <CreditCard className="h-6 w-6 text-emerald-400" />
              </div>

            </div>

          </CardContent>
        </Card>

      </div>

      {/* MAIN GRID */}

      <div className="grid xl:grid-cols-3 gap-6">

        {/* LOYALTY */}

        <Card className={`${cardStyle} xl:col-span-2`}>
          <CardContent className="p-6">

            <div className="flex justify-between">

              <div>

                <h2 className="text-2xl font-black">
                  Loyalty Progress
                </h2>

                <p className="text-slate-400 mt-2">
                  {stats.loyaltyPoints} points available
                </p>

              </div>

              <Star className="text-yellow-400" />

            </div>

            <div className="mt-6 h-5 rounded-full bg-[#091A34] overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                style={{
                  width: `${loyaltyProgress}%`,
                }}
              />

            </div>

            <p className="text-slate-400 mt-4">
              {pointsRemaining} points until next tier.
            </p>

          </CardContent>
        </Card>

        {/* SUBSCRIPTION */}

        <Card className={cardStyle}>
          <CardContent className="p-6">

            <h2 className="font-black text-xl mb-4">
              Subscription
            </h2>

            <p className="text-cyan-400 font-semibold">
              {stats.subscription}
            </p>

          </CardContent>
        </Card>

        {/* VEHICLES */}

        <Card className={cardStyle}>
          <CardContent className="relative p-6">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.12),transparent_45%)]" />

            <div className="relative flex justify-between items-start">

              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider">
                  Vehicles
                </p>

                <h2 className="mt-3 text-5xl font-black text-white">
                  {stats.vehicles}
                </h2>
              </div>

              <div className="
        h-14
        w-14
        rounded-2xl
        bg-cyan-500/10
        border
        border-cyan-500/20
        flex
        items-center
        justify-center
      ">
                <Car className="h-6 w-6 text-cyan-400" />
              </div>

            </div>

          </CardContent>
        </Card>

        {/* BOOKINGS */}

        <Card className={cardStyle}>
          <CardContent className="p-6">

            <h2 className="font-black text-xl mb-4">
              Upcoming Booking
            </h2>

            {nextBooking ? (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">

                <p className="font-semibold">
                  {nextBooking.service}
                </p>

                <p className="text-slate-400">
                  {nextBooking.date}
                </p>

              </div>
            ) : (
              <p className="text-slate-500">
                No upcoming bookings.
              </p>
            )}

          </CardContent>
        </Card>

        {/* REWARDS */}

        <Card className={cardStyle}>
          <CardContent className="p-6">

            <h2 className="font-black text-xl mb-4">
              Rewards Available
            </h2>

            <div className="space-y-3">

              {rewards.slice(0, 3).map(reward => (
                <div
                  key={reward.id}
                  className="rounded-xl border border-white/10 p-4 flex justify-between"
                >
                  <span>{reward.title}</span>

                  <span className="text-cyan-400">
                    {reward.points_required} pts
                  </span>
                </div>
              ))}

            </div>

          </CardContent>
        </Card>

      </div>

    </div >
  );
}