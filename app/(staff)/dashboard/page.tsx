"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

import {
  Building2,
  ShieldCheck,
  Layers3,
  Car,
  RefreshCw,
  Users,
  MapPin,
  UserPlus,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,

  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);

  const [carwash, setCarwash] = useState<any>(null);

  const [branch, setBranch] = useState<any>(null);

  const [kpis, setKpis] = useState({
    revenueToday: 0,
    revenueMonth: 0,
    netProfit: 0,
    expensesMonth: 0,
    pendingPayments: 0,
    averageTicket: 0,
  });

  //Revenue analytics
  const [period, setPeriod] =
    useState("month");

  const [chartData, setChartData] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  //Paymet method
  const [paymentMethods, setPaymentMethods] =
    useState<any[]>([]);

  //service performance
  const [servicePerformance, setServicePerformance] =
    useState<any[]>([]);
  //topcustomers
  const [topCustomers, setTopCustomers] =
    useState<any[]>([]);

  //LoadDashboard
  const loadDashboard = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      /* PROFILE */

      const { data: profileData } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

      if (!profileData) return;

      setProfile(profileData);

      await loadRevenueAnalytics(
        profileData.carwash_id,
        period
      );

      /* CARWASH */

      const { data: carwashData } =
        await supabase
          .from("carwashes")
          .select("*")
          .eq(
            "id",
            profileData.carwash_id
          )
          .single();

      setCarwash(carwashData);

      /* KPI DATA */

      const { data: dashboardData } =
        await supabase
          .from("dashboard_kpis")
          .select("*")
          .eq(
            "carwash_id",
            profileData.carwash_id
          )
          .single();

      console.log("Dashboard KPIs:", dashboardData);

      if (dashboardData) {
        setKpis({
          revenueToday:
            Number(
              dashboardData.revenue_today
            ) || 0,

          revenueMonth:
            Number(
              dashboardData.revenue_month
            ) || 0,

          netProfit:
            Number(
              dashboardData.net_profit
            ) || 0,

          expensesMonth:
            Number(
              dashboardData.expenses_month
            ) || 0,

          pendingPayments:
            Number(
              dashboardData.pending_payments
            ) || 0,

          averageTicket:
            Number(
              dashboardData.average_ticket
            ) || 0,
        });
      }
      //Payment data
      const { data: paymentData } =
        await supabase
          .from("payment_methods_summary")
          .select("*")
          .eq(
            "carwash_id",
            profileData.carwash_id
          );

      if (paymentData) {
        setPaymentMethods(paymentData);
      }

      //service performance
      const { data: serviceData } =
        await supabase
          .from("service_performance")
          .select("*")
          .eq(
            "carwash_id",
            profileData.carwash_id
          )
          .order(
            "revenue",
            { ascending: false }
          );

      if (serviceData) {
        setServicePerformance(serviceData);
      }
      //topcustomers
      const { data: customerData } =
        await supabase
          .from("top_customers")
          .select("*")
          .eq(
            "carwash_id",
            profileData.carwash_id
          )
          .order(
            "total_spent",
            { ascending: false }
          )
          .limit(5);

      if (customerData) {
        setTopCustomers(customerData);
      }

      /* BRANCH */

      if (profileData.branch_id) {
        const { data: branchData } =
          await supabase
            .from("branches")
            .select("*")
            .eq(
              "id",
              profileData.branch_id
            )
            .single();

        setBranch(branchData);
      }
    } catch (error) {
      console.error(
        "Dashboard Load Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (profile?.carwash_id) {
      loadRevenueAnalytics(
        profile.carwash_id,
        period
      );
    }
  }, [period]);

  //Load chart data
  const loadRevenueAnalytics =
    async (
      carwashId: string,
      selectedPeriod: string
    ) => {
      const { data, error } =
        await supabase.rpc(
          "get_revenue_analytics",
          {
            p_carwash_id: carwashId,
            p_period: selectedPeriod,
          }
        );

      if (!error) {
        setChartData(data || []);
      }
    };

  const PAYMENT_COLORS = [
    "#22c55e",
    "#f97316",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
  ];

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}

      <Card className="border-slate-800 bg-slate-950/70 backdrop-blur-xl text-white">
        <CardContent className="p-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-center gap-4">

              <div className="h-16 w-16 rounded-2xl bg-blue-950 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>

              <div>

                <div className="flex items-center gap-3 flex-wrap">

                  <h1 className="text-4xl font-bold">
                    Enterprise Dashboard
                  </h1>

                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Production Ready
                  </Badge>

                </div>

                <div className="flex gap-5 mt-2 text-slate-400 flex-wrap">

                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Secure Carwash
                  </span>

                  <span className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4" />
                    Multi Branch
                  </span>

                  <span className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    SaaS Platform
                  </span>

                </div>

              </div>

            </div>

            <div className="flex gap-3">

              {profile?.role?.toLowerCase() === "manager" && (
                <Link href="/staff/add-staff">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Staff
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                onClick={loadDashboard}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

            </div>

          </div>

        </CardContent>
      </Card>

      {/* CARWASH INFO BAR */}

      <Card className="border-slate-800 bg-slate-950/70 backdrop-blur-xl text-white">
        <CardContent className="py-4">

          <div className="flex items-center justify-between w-full">

            <div className="flex items-center gap-2">

              <MapPin className="h-4 w-4 text-orange-400" />

              <span className="text-slate-400">
                Branch:
              </span>

              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                {branch?.name || "All Branches"}
              </Badge>

            </div>

            <div className="flex items-center gap-2">

              <Users className="h-4 w-4 text-purple-400" />

              <span className="text-slate-400">
                Role:
              </span>

              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                {profile?.role || "Loading..."}
              </Badge>

            </div>

            <div className="flex items-center gap-2">

              <Building2 className="h-4 w-4 text-cyan-400" />

              <span className="text-slate-400">
                Carwash ID:
              </span>

              <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                {profile?.carwash_id}
              </Badge>

            </div>

          </div>

        </CardContent>
      </Card>

      {/* KPI CARDS */}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">
              Revenue Today
            </p>
            <h2 className="text-2xl font-bold">
              KSh {kpis.revenueToday.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">
              Revenue Month
            </p>
            <h2 className="text-2xl font-bold">
              KSh {kpis.revenueMonth.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">
              Net Profit
            </p>
            <h2 className="text-2xl font-bold text-green-400">
              KSh {kpis.netProfit.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">
              Expenses
            </p>
            <h2 className="text-2xl font-bold text-red-400">
              KSh {kpis.expensesMonth.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">
              Pending Payments
            </p>
            <h2 className="text-2xl font-bold text-yellow-400">
              KSh {kpis.pendingPayments.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">
              Avg Ticket
            </p>
            <h2 className="text-2xl font-bold text-cyan-400">
              KSh {Math.round(kpis.averageTicket).toLocaleString()}
            </h2>
          </CardContent>
        </Card>

      </div>

      <Card className="bg-slate-950/70 border-slate-800 text-white">
        <CardContent className="p-6">

          {/* HEADER */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <div>
              <h2 className="text-xl font-semibold">
                Revenue Analytics
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Revenue trends over time
              </p>
            </div>

            <div className="flex gap-2">

              {[
                {
                  value: "day",
                  label: "Today",
                },
                {
                  value: "week",
                  label: "7 Days",
                },
                {
                  value: "month",
                  label: "30 Days",
                },
                {
                  value: "year",
                  label: "12 Months",
                },
              ].map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  onClick={() =>
                    setPeriod(item.value)
                  }
                  className={
                    period === item.value
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                  }
                >
                  {item.label}
                </Button>
              ))}

            </div>

          </div>

          {/* CHART */}

          <div className="h-[260px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  vertical={false}
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12,
                  }}
                  tickFormatter={(v) =>
                    `KSh ${v}`
                  }
                />

                <Tooltip
                  formatter={(value: any) => [
                    `KSh ${Number(
                      value
                    ).toLocaleString()}`,
                    "Revenue",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          {/* FOOTER */}

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">

            <div>

              <p className="text-xs text-slate-400">
                Total Revenue
              </p>

              <p className="text-2xl font-bold text-green-400">
                KSh {kpis.revenueMonth.toLocaleString()}
              </p>

            </div>

            <div className="text-right">

              <p className="text-xs text-slate-400">
                Average Ticket
              </p>

              <p className="text-lg font-semibold text-cyan-400">
                KSh {Math.round(
                  kpis.averageTicket
                ).toLocaleString()}
              </p>

            </div>

          </div>

        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Payment Methods
              </h2>

              <p className="text-sm text-slate-400">
                Revenue distribution
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* CHART */}

              <div className="h-[260px]">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={paymentMethods}
                      dataKey="total_amount"
                      nameKey="payment_method"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                    >

                      {paymentMethods.map(
                        (_, index) => (
                          <Cell
                            key={index}
                            fill={
                              PAYMENT_COLORS[
                              index %
                              PAYMENT_COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value: any) => [
                        `KSh ${Number(
                          value
                        ).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />

                  </PieChart>

                </ResponsiveContainer>

              </div>

              {/* BREAKDOWN */}

              <div className="flex flex-col justify-center gap-4">

                {paymentMethods.map(
                  (method, index) => (
                    <div
                      key={method.payment_method}
                      className="flex items-center justify-between"
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              PAYMENT_COLORS[
                              index %
                              PAYMENT_COLORS.length
                              ],
                          }}
                        />

                        <span>
                          {method.payment_method}
                        </span>

                      </div>

                      <span className="font-semibold">
                        KSh{" "}
                        {Number(
                          method.total_amount
                        ).toLocaleString()}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-800 text-white">
          <CardContent className="p-6">

            <div className="mb-6">

              <h2 className="text-xl font-semibold">
                Service Performance
              </h2>

              <p className="text-sm text-slate-400">
                Ranked by revenue contribution
              </p>

            </div>

            <div className="h-[260px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  layout="vertical"
                  data={servicePerformance}
                  margin={{
                    left: 30,
                    right: 20,
                  }}
                >

                  <CartesianGrid
                    horizontal={false}
                    stroke="#1e293b"
                  />

                  <XAxis
                    type="number"
                    tickFormatter={(v) =>
                      `KSh ${v}`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="service_name"
                    width={160}
                    tick={{
                      fill: "#cbd5e1",
                      fontSize: 13,
                    }}
                  />

                  <Tooltip
                    formatter={(value: any) => [
                      `KSh ${Number(
                        value
                      ).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />

                  <defs>
                    <linearGradient
                      id="serviceGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#06b6d4"
                      />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    type="number"
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="service_name"
                    width={160}
                    tick={{
                      fill: "#cbd5e1",
                      fontSize: 13,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                    radius={[0, 8, 8, 0]}
                    barSize={32}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-950/70 border-slate-800 text-white">
        <CardContent className="p-6">

          <div className="mb-6">

            <h2 className="text-xl font-semibold">
              Top Customers
            </h2>

            <p className="text-sm text-slate-400">
              Highest spending customers
            </p>

          </div>

          <div className="space-y-4">

            {topCustomers.map((customer, index) => (

              <div
                key={customer.customer_id}
                className="flex items-center justify-between border-b border-slate-800 pb-3"
              >

                <div className="flex items-center gap-4">

                  <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">

                    #{index + 1}

                  </div>

                  <div>

                    <p className="font-medium">
                      {customer.customer_name}
                    </p>

                    <p className="text-sm text-slate-400">
                      {customer.visits} visits
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="font-bold text-green-400">
                    KSh {Number(
                      customer.total_spent
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </CardContent>
      </Card>

    </div>
  );
}