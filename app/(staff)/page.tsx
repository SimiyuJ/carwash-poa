"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import Hero from "@/components/dashboard/Hero";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LiveQueue from "@/components/dashboard/LiveQueue";
import PopularServices from "@/components/dashboard/PopularServices";

export default function DashboardPage() {
  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState<any[]>([]);

  const [activity, setActivity] =
    useState<any[]>([]);

  const [queue, setQueue] =
    useState<any[]>([]);

  const [services, setServices] =
    useState<any[]>([]);

  const [vehicleCount, setVehicleCount] =
    useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData =
    async () => {
      try {
        setLoading(true);

        const [
          { count: washCount },
          { data: subs },
          { data: payments },
          { data: vehicles },
        ] = await Promise.all([
          supabase
            .from("washes")
            .select("*", {
              count: "exact",
              head: true,
            }),

          supabase
            .from("subscriptions")
            .select("id")
            .eq("status", "active"),

          supabase
            .from("transactions")
            .select("amount"),

          supabase
            .from("vehicles")
            .select(
              `
                id,
                name,
                service,
                created_at
              `
            )
            .order("created_at", {
              ascending: false,
            }),
        ]);

        const totalRevenue =
          payments?.reduce(
            (
              sum,
              payment
            ) =>
              sum +
              (payment.amount || 0),
            0
          ) || 0;

        setVehicleCount(
          vehicles?.length || 0
        );

        /* =========================
           STATS
        ========================= */

        setStats([
          {
            title:
              "Today's Washes",

            value:
              washCount || 0,

            change: "+12%",

            up: true,
          },

          {
            title:
              "Active Subs",

            value:
              subs?.length || 0,

            change: "+5%",

            up: true,
          },

          {
            title: "Revenue",

            value: `KSh ${totalRevenue.toLocaleString()}`,

            change: "+18%",

            up: true,
          },

          {
            title: "Queue",

            value:
              vehicles?.length || 0,

            change: "-2",

            up: false,
          },
        ]);

        /* =========================
           RECENT ACTIVITY
        ========================= */

        setActivity([
          {
            title:
              "Wash completed",

            detail:
              "Toyota Camry",

            time:
              "2 min ago",
          },

          {
            title:
              "New subscription",

            detail:
              "John Doe",

            time:
              "5 min ago",
          },

          {
            title:
              "Payment received",

            detail:
              "KSh 2,000",

            time:
              "10 min ago",
          },
        ]);

        /* =========================
           LIVE QUEUE
        ========================= */

        setQueue(
          vehicles
            ?.slice(0, 5)
            .map(
              (
                vehicle,
                index
              ) => ({
                position:
                  index + 1,

                vehicle:
                  vehicle.name ||
                  "Vehicle",

                service:
                  vehicle.service ||
                  "Wash",

                status:
                  index === 0
                    ? "In Progress"
                    : "Waiting",

                eta: `${(index + 1) * 5
                  } min`,
              })
            ) || []
        );

        /* =========================
           SERVICES
        ========================= */

        setServices([
          {
            name:
              "Basic Wash",

            count: 156,

            revenue:
              "KSh 2,340",

            pct: 40,
          },

          {
            name:
              "Premium Wash",

            count: 98,

            revenue:
              "KSh 3,920",

            pct: 60,
          },

          {
            name:
              "Full Detail",

            count: 42,

            revenue:
              "KSh 4,200",

            pct: 75,
          },
        ]);
      } catch (error) {
        console.error(
          "Dashboard Error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================
     LOADING UI
  ========================= */

  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-36 rounded-3xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
        </div>

        <div className="h-[400px] rounded-3xl bg-slate-200" />
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Hero />

      {/* STATS */}
      <StatsCards stats={stats} />

      {/* VEHICLES */}
      <div
        className="
          rounded-3xl
          border border-slate-200
          bg-white
          p-6
          shadow-sm
        "
      >
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              className="
                text-2xl
                font-bold
                text-slate-900
              "
            >
              Vehicles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {vehicleCount} vehicles
              currently active
            </p>
          </div>

          <div
            className="
              rounded-full
              bg-cyan-50
              px-4
              py-2
              text-xs
              font-semibold
              text-cyan-700
            "
          >
            Live Queue
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mb-5 border-t border-slate-100" />

        {/* TABLE */}
        <div className="rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">
            Vehicles will appear here
          </p>
        </div>
      </div>

      {/* LOWER GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentActivity data={activity} />

        <LiveQueue queue={queue} />
      </div>

      {/* SERVICES */}
      <PopularServices services={services} />
    </div>
  );
}