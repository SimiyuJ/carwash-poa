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
  Trophy,
  RefreshCw,
  Users,
  MapPin,
  UserPlus,
  Wallet,
  TrendingUp,
  BadgeDollarSign,
  ReceiptText,
  Clock3,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
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
  const [period, setPeriod] = useState("month");

  const [chartData, setChartData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  //Paymet method
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  //service performance
  const [servicePerformance, setServicePerformance] = useState<any[]>([]);
  //topcustomers
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  //LoadDashboard
  const loadDashboard = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      /* PROFILE */

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) return;

      setProfile(profileData);

      await loadRevenueAnalytics(profileData.carwash_id, period);

      /* CARWASH */

      const { data: carwashData } = await supabase
        .from("carwashes")
        .select("*")
        .eq("id", profileData.carwash_id)
        .single();

      setCarwash(carwashData);

      /* KPI DATA */

      const { data: dashboardData } = await supabase
        .from("dashboard_kpis")
        .select("*")
        .eq("carwash_id", profileData.carwash_id)
        .single();

      if (dashboardData) {
        setKpis({
          revenueToday: Number(dashboardData.revenue_today) || 0,

          revenueMonth: Number(dashboardData.revenue_month) || 0,

          netProfit: Number(dashboardData.net_profit) || 0,

          expensesMonth: Number(dashboardData.expenses_month) || 0,

          pendingPayments: Number(dashboardData.pending_payments) || 0,

          averageTicket: Number(dashboardData.average_ticket) || 0,
        });
      }
      //Payment data
      const { data: paymentData } = await supabase
        .from("payment_methods_summary")
        .select("*")
        .eq("carwash_id", profileData.carwash_id);

      if (paymentData) {
        setPaymentMethods(paymentData);
      }

      //service performance
      const { data: serviceData } = await supabase
        .from("service_performance")
        .select("*")
        .eq("carwash_id", profileData.carwash_id)
        .order("revenue", { ascending: false });

      if (serviceData) {
        setServicePerformance(serviceData);
      }
      //topcustomers
      const { data: customerData } = await supabase
        .from("top_customers")
        .select("*")
        .eq("carwash_id", profileData.carwash_id)
        .order("total_spent", { ascending: false })
        .limit(5);

      if (customerData) {
        setTopCustomers(customerData);
      }

      /* BRANCH */

      if (profileData.branch_id) {
        const { data: branchData } = await supabase
          .from("branches")
          .select("*")
          .eq("id", profileData.branch_id)
          .single();

        setBranch(branchData);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (profile?.carwash_id) {
      loadRevenueAnalytics(profile.carwash_id, period);
    }
  }, [period]);

  //Load chart data
  const loadRevenueAnalytics = async (
    carwashId: string,
    selectedPeriod: string,
  ) => {
    const { data, error } = await supabase.rpc("get_revenue_analytics", {
      p_carwash_id: carwashId,
      p_period: selectedPeriod,
    });

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

      <Card className="overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] text-white shadow-2xl">
        <CardContent className="relative p-5 sm:p-6 lg:p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shadow-lg shadow-cyan-500/10">
                <Building2 className="h-10 w-10 text-cyan-400" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Enterprise Dashboard
                  </h1>

                  <Badge className="border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-400">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    Production Ready
                  </Badge>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Manage your carwash operations, monitor branches, staff
                  performance, invoices, revenue and customer activity from one
                  intelligent dashboard.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />

                    <span className="text-sm font-medium text-slate-300">
                      Secure Platform
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
                    <Layers3 className="h-4 w-4 text-cyan-400" />

                    <span className="text-sm font-medium text-slate-300">
                      Multi Branch
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
                    <Car className="h-4 w-4 text-orange-400" />

                    <span className="text-sm font-medium text-slate-300">
                      SaaS POS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
              {profile?.role?.toLowerCase() === "manager" && (
                <Link href="/staff/add-staff" className="w-full">
                  <Button className="h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:shadow-cyan-500/30">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add Staff
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                onClick={loadDashboard}
                className="h-12 rounded-2xl border-slate-700 bg-slate-900/80 text-white transition hover:border-cyan-500 hover:bg-slate-800"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Refresh Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] text-white shadow-xl">
        <CardContent className="p-3 sm:p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3 transition-all hover:border-orange-400/40 hover:bg-orange-500/10">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                <MapPin className="h-5 w-5 text-orange-400" />
              </div>

              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
                Branch
              </p>

              <p className="mt-1 truncate text-center text-xs font-bold text-orange-300 sm:text-sm">
                {branch?.name || "All Branches"}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 transition-all hover:border-purple-400/40 hover:bg-purple-500/10">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-400" />
              </div>

              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
                Role
              </p>

              <p className="mt-1 truncate text-center text-xs font-bold text-purple-300 capitalize sm:text-sm">
                {profile?.role || "Loading..."}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Building2 className="h-5 w-5 text-cyan-400" />
              </div>

              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
                Carwash
              </p>

              <p className="mt-1 truncate text-center font-mono text-[11px] font-bold text-cyan-300 sm:text-sm">
                {profile?.carwash_id || "--"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="group overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#081A33] to-[#0B1220] text-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10">
          <CardContent className="p-3 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-xs">
              Today
            </p>

            <h2 className="mt-1 text-sm font-black text-white sm:text-2xl">
              KSh {kpis.revenueToday.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-[#081A33] to-[#0B1220] text-white transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10">
          <CardContent className="p-3 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-xs">
              Month
            </p>

            <h2 className="mt-1 text-sm font-black text-white sm:text-2xl">
              KSh {kpis.revenueMonth.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 via-[#081A33] to-[#0B1220] text-white transition-all duration-300 hover:-translate-y-1 hover:border-green-400 hover:shadow-xl hover:shadow-green-500/10">
          <CardContent className="p-3 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/15">
              <BadgeDollarSign className="h-5 w-5 text-green-400" />
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-xs">
              Profit
            </p>

            <h2 className="mt-1 text-sm font-black text-green-400 sm:text-2xl">
              KSh {kpis.netProfit.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-[#081A33] to-[#0B1220] text-white transition-all duration-300 hover:-translate-y-1 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/10">
          <CardContent className="p-3 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15">
              <ReceiptText className="h-5 w-5 text-red-400" />
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-xs">
              Expenses
            </p>

            <h2 className="mt-1 text-sm font-black text-red-400 sm:text-2xl">
              KSh {kpis.expensesMonth.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-[#081A33] to-[#0B1220] text-white transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400 hover:shadow-xl hover:shadow-yellow-500/10">
          <CardContent className="p-3 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-500/15">
              <Clock3 className="h-5 w-5 text-yellow-400" />
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-xs">
              Pending
            </p>

            <h2 className="mt-1 text-sm font-black text-yellow-400 sm:text-2xl">
              KSh {kpis.pendingPayments.toLocaleString()}
            </h2>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-[#081A33] to-[#0B1220] text-white transition-all duration-300 hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl hover:shadow-violet-500/10">
          <CardContent className="p-3 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15">
              <BarChart3 className="h-5 w-5 text-violet-400" />
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-xs">
              Avg Ticket
            </p>

            <h2 className="mt-1 text-sm font-black text-violet-400 sm:text-2xl">
              KSh {Math.round(kpis.averageTicket).toLocaleString()}
            </h2>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] text-white shadow-2xl">
        <CardContent className="relative p-5 sm:p-6 lg:p-8">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10">
                  <LineChartIcon className="h-8 w-8 text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-black">Revenue Analytics</h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Track revenue performance across your business.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {[
                  { value: "day", label: "Today" },
                  { value: "week", label: "7 Days" },
                  { value: "month", label: "30 Days" },
                  { value: "year", label: "12 Months" },
                ].map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    onClick={() => setPeriod(item.value)}
                    className={`h-10 rounded-xl transition-all

              ${
                period === item.value
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-500 hover:bg-slate-800"
              }`}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="h-[260px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueStroke"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
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
                      tickFormatter={(v) => `KSh ${v}`}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#081A33",
                        border: "1px solid #164e63",
                        borderRadius: "16px",
                        color: "#fff",
                      }}
                      formatter={(value: any) => [
                        `KSh ${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#revenueStroke)"
                      strokeWidth={4}
                      dot={{
                        r: 4,
                        fill: "#06b6d4",
                      }}
                      activeDot={{
                        r: 8,
                        fill: "#3b82f6",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-xs uppercase tracking-widest text-green-300">
                  Total Revenue
                </p>

                <h3 className="mt-2 text-2xl font-black text-green-400">
                  KSh {kpis.revenueMonth.toLocaleString()}
                </h3>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-300">
                  Average Ticket
                </p>

                <h3 className="mt-2 text-2xl font-black text-cyan-400">
                  KSh {Math.round(kpis.averageTicket).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] text-white shadow-2xl">
          <CardContent className="relative p-5 sm:p-6 lg:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10">
                    <PieChartIcon className="h-8 w-8 text-cyan-400" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">Payment Methods</h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Revenue distribution by payment method.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3">
                  <p className="text-xs uppercase tracking-widest text-cyan-300">
                    Methods
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-cyan-400">
                    {paymentMethods.length}
                  </h3>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        dataKey="total_amount"
                        nameKey="payment_method"
                        innerRadius={75}
                        outerRadius={115}
                        paddingAngle={4}
                        stroke="transparent"
                      >
                        {paymentMethods.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "#081A33",
                          border: "1px solid #334155",
                          borderRadius: "16px",
                          color: "#fff",
                        }}
                        formatter={(value: any) => [
                          `KSh ${Number(value).toLocaleString()}`,
                          "Revenue",
                        ]}
                      />

                      <text
                        x="50%"
                        y="47%"
                        textAnchor="middle"
                        className="fill-slate-400 text-xs"
                      >
                        Total Revenue
                      </text>

                      <text
                        x="50%"
                        y="56%"
                        textAnchor="middle"
                        className="fill-white text-xl font-bold"
                      >
                        KSh{" "}
                        {paymentMethods
                          .reduce(
                            (sum, item) => sum + Number(item.total_amount),
                            0,
                          )
                          .toLocaleString()}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {paymentMethods.map((method, index) => {
                  const total = paymentMethods.reduce(
                    (sum, item) => sum + Number(item.total_amount),
                    0,
                  );

                  const percentage =
                    total > 0
                      ? ((Number(method.total_amount) / total) * 100).toFixed(1)
                      : "0";

                  return (
                    <div
                      key={method.payment_method}
                      className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition-all hover:border-cyan-500/30 hover:bg-slate-900/60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full shadow-lg"
                            style={{
                              backgroundColor:
                                PAYMENT_COLORS[index % PAYMENT_COLORS.length],
                            }}
                          />

                          <div>
                            <h3 className="font-semibold text-white">
                              {method.payment_method}
                            </h3>

                            <p className="text-xs text-slate-400">
                              {percentage}% of revenue
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <h3 className="font-black text-green-400">
                            KSh {Number(method.total_amount).toLocaleString()}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              PAYMENT_COLORS[index % PAYMENT_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border border-violet-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] text-white shadow-2xl">
          <CardContent className="relative p-5 sm:p-6 lg:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-500/20 bg-violet-500/10">
                    <BarChart3 className="h-8 w-8 text-violet-400" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">Service Performance</h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Revenue contribution by each wash service.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-3">
                  <p className="text-xs uppercase tracking-widest text-violet-300">
                    Services
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-violet-400">
                    {servicePerformance.length}
                  </h3>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="h-[280px] sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={servicePerformance}
                      margin={{
                        top: 10,
                        right: 15,
                        left: 15,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="serviceGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        horizontal={false}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                      />

                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                        }}
                        tickFormatter={(v) => `KSh ${v}`}
                      />

                      <YAxis
                        type="category"
                        dataKey="service_name"
                        width={130}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#CBD5E1",
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#081A33",
                          border: "1px solid #334155",
                          borderRadius: "16px",
                          color: "#fff",
                        }}
                        formatter={(value: any) => [
                          `KSh ${Number(value).toLocaleString()}`,
                          "Revenue",
                        ]}
                      />

                      <Bar
                        dataKey="revenue"
                        fill="url(#serviceGradient)"
                        radius={[0, 12, 12, 0]}
                        barSize={26}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                    Top Service
                  </p>

                  <h3 className="mt-2 truncate text-sm font-bold text-white sm:text-lg">
                    {servicePerformance[0]?.service_name || "--"}
                  </h3>
                </div>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-green-300">
                    Revenue
                  </p>

                  <h3 className="mt-2 text-sm font-black text-green-400 sm:text-lg">
                    KSh{" "}
                    {Number(
                      servicePerformance[0]?.revenue || 0,
                    ).toLocaleString()}
                  </h3>
                </div>

                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300">
                    Services
                  </p>

                  <h3 className="mt-2 text-sm font-black text-violet-400 sm:text-lg">
                    {servicePerformance.length}
                  </h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-amber-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] text-white shadow-2xl">
        <CardContent className="relative p-5 sm:p-6 lg:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/10">
                  <Trophy className="h-8 w-8 text-amber-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-black">Top Customers</h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Highest spending customers across your carwash.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3">
                <p className="text-xs uppercase tracking-widest text-amber-300">
                  Customers
                </p>

                <h3 className="mt-1 text-2xl font-black text-amber-400">
                  {topCustomers.length}
                </h3>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.customer_id}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-slate-900/70"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black

                ${
                  index === 0
                    ? "bg-yellow-500/20 text-yellow-400"
                    : index === 1
                      ? "bg-slate-400/20 text-slate-300"
                      : index === 2
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-cyan-500/10 text-cyan-400"
                }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-white">
                        {customer.customer_name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Car className="h-4 w-4 text-cyan-400" />
                          {customer.visits} Visits
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Total Spent
                    </p>

                    <h3 className="mt-1 text-lg font-black text-green-400 sm:text-xl">
                      KSh {Number(customer.total_spent).toLocaleString()}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                  Top Customer
                </p>

                <h3 className="mt-2 truncate text-sm font-bold sm:text-lg">
                  {topCustomers[0]?.customer_name || "--"}
                </h3>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-green-300">
                  Highest Spend
                </p>

                <h3 className="mt-2 text-sm font-black text-green-400 sm:text-lg">
                  KSh{" "}
                  {Number(topCustomers[0]?.total_spent || 0).toLocaleString()}
                </h3>
              </div>

              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300">
                  Total Listed
                </p>

                <h3 className="mt-2 text-sm font-black text-violet-400 sm:text-lg">
                  {topCustomers.length}
                </h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
