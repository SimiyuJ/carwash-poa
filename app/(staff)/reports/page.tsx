"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import { supabase } from "@/lib/supabase";

import {
  DollarSign,
  Car,
  Users,
  Wallet,
  Receipt,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Activity,
  BarChart3,
  Search,
  Building2,
  BadgeCheck,
  Clock3,
  AlertCircle,
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
  AreaChart,
  Area,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ======================================================
   TYPES
====================================================== */

type KPI = {
  title: string;
  value: string | number;
  icon: any;
};

type DashboardKpis = {
  revenue_today?: number;
  total_revenue?: number;
};

type Invoice = {
  id: string;

  invoice_number?: string;

  vehicle_id?: string;
  customer_id?: string;

  plate?: string;

  customer?: string;
  customer_name?: string;

  services?: any[];

  subtotal?: number;
  vat?: number;

  total: number;

  payment_status?: string;
  payment_method?: string;

  created_at: string;

  paid_at?: string;

  amount_paid?: number;

  branch_id?: string;
};

type Expense = {
  id?: string;
  amount: number;
  category?: string;
  created_at?: string;
  branch_name?: string;
  status?: string;
};

type Branch = {
  id: string;
  name: string;
};

/* ======================================================
   PAGE
====================================================== */

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);

  const [carwashId, setCarwashId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("overview");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  const [branchFilter, setBranchFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [kpis, setKpis] = useState<DashboardKpis>({});

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [vehicles, setVehicles] = useState<any[]>([]);

  const [customers, setCustomers] = useState<any[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [branches, setBranches] = useState<Branch[]>([]);

  /* ======================================================
     QUICK FILTERS
  ====================================================== */

  const applyQuickFilter = (type: string) => {
    const today = new Date();

    if (type === "today") {
      const d = today.toISOString().split("T")[0];

      setDateFrom(d);
      setDateTo(d);
    }

    if (type === "week") {
      const first = new Date();

      first.setDate(today.getDate() - 7);

      setDateFrom(first.toISOString().split("T")[0]);

      setDateTo(today.toISOString().split("T")[0]);
    }

    if (type === "month") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);

      setDateFrom(first.toISOString().split("T")[0]);

      setDateTo(today.toISOString().split("T")[0]);
    }

    if (type === "year") {
      const first = new Date(today.getFullYear(), 0, 1);

      setDateFrom(first.toISOString().split("T")[0]);

      setDateTo(today.toISOString().split("T")[0]);
    }
  };

  /* ======================================================
     LOAD REPORTS
  ====================================================== */

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);

      const from = dateFrom
        ? new Date(dateFrom + "T00:00:00").toISOString()
        : "1970-01-01T00:00:00.000Z";

      const to = dateTo
        ? new Date(dateTo + "T23:59:59").toISOString()
        : new Date().toISOString();

      let invoiceQuery = supabase
        .from("invoices")
        .select("*")
        .eq("carwash_id", carwashId)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", {
          ascending: false,
        });

      if (branchFilter !== "all") {
        invoiceQuery = invoiceQuery.eq("branch_id", branchFilter);
      }

      let expenseQuery = supabase
        .from("expenses")
        .select("*")
        .eq("carwash_id", carwashId);

      if (branchFilter !== "all") {
        expenseQuery = expenseQuery.eq("branch_id", branchFilter);
      }

      const [
        kpiRes,
        txRes,
        vehiclesRes,
        customersRes,
        expensesRes,
        branchesRes,
      ] = await Promise.all([
        supabase
          .from("dashboard_kpis")
          .select("*")
          .eq("carwash_id", carwashId)
          .single(),

        invoiceQuery,

        supabase.from("vehicles").select("*").eq("carwash_id", carwashId),

        supabase.from("customers").select("*").eq("carwash_id", carwashId),

        supabase.from("expenses").select("*").eq("carwash_id", carwashId),

        supabase.from("branches").select("*").eq("carwash_id", carwashId),
      ]);

      setKpis(kpiRes.data || {});
      setInvoices(txRes.data || []);
      setVehicles(vehiclesRes.data || []);

      setCustomers(customersRes.data || []);

      setExpenses(expensesRes.data || []);

      setBranches(branchesRes.data || []);
    } catch (err) {
      console.error("Reports error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, branchFilter]);
  /* ======================================================
      TAB STYLES
    ====================================================== */
  const tabStyles = {
    overview: "border-cyan-500 text-cyan-400",
    invoices: "border-emerald-500 text-emerald-400",
    expenses: "border-red-500 text-red-400",
    analytics: "border-violet-500 text-violet-400",
  };
  /* ======================================================
       PROFILE
    ====================================================== */
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("carwash_id, branch_id")
        .eq("id", user.id)
        .single();

      if (!data) return;

      setCarwashId(data.carwash_id);

      if (data.branch_id) {
        setBranchFilter(data.branch_id);
      }
    };

    loadProfile();
  }, []);

  /* ======================================================
     REALTIME
  ====================================================== */

  useEffect(() => {
    loadReports();

    const channel = supabase
      .channel("reports-live")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
        },
        () => {
          loadReports();
        },
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        () => {
          loadReports();
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReports]);

  /* ======================================================
     COMPUTED
  ====================================================== */

  const computed = useMemo(() => {
    const revenueToday = Number(kpis.revenue_today || 0);

    const paidInvoices = invoices.filter(
      (i) => String(i.payment_status).toUpperCase() === "PAID",
    );

    const totalRevenue =
      paidInvoices.reduce((sum, i) => sum + Number(i.total || 0), 0) ||
      Number(kpis.total_revenue || 0);

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0,
    );

    const profit = totalRevenue - totalExpenses;

    const avgTicket = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    const mpesaInvoices = paidInvoices.filter((i) =>
      String(i.payment_method || "")
        .toLowerCase()
        .includes("mpesa"),
    );

    const cashInvoices = paidInvoices.filter((i) =>
      String(i.payment_method || "")
        .toLowerCase()
        .includes("cash"),
    );

    const cardInvoices = paidInvoices.filter((i) =>
      String(i.payment_method || "")
        .toLowerCase()
        .includes("card"),
    );

    return {
      revenueToday,
      totalRevenue,
      totalExpenses,
      profit,
      avgTicket,

      totalVehicles: vehicles.length,

      totalCustomers: customers.length,

      mpesaTotal: mpesaInvoices.reduce((s, i) => s + Number(i.total || 0), 0),

      cashTotal: cashInvoices.reduce((s, i) => s + Number(i.total || 0), 0),

      cardTotal: cardInvoices.reduce((s, i) => s + Number(i.total || 0), 0),
    };
  }, [kpis, invoices, expenses, vehicles, customers]);

  /* ======================================================
     FILTERED TRANSACTIONS
  ====================================================== */

  const filteredInvoices = invoices.filter((i) => {
    const q = search.toLowerCase();

    return (
      i.customer?.toLowerCase().includes(q) ||
      i.customer_name?.toLowerCase().includes(q) ||
      i.plate?.toLowerCase().includes(q) ||
      i.payment_method?.toLowerCase().includes(q) ||
      i.invoice_number?.toLowerCase().includes(q)
    );
  });

  /* ======================================================
     FORMAT
  ====================================================== */

  const formatKES = (amount: number) => {
    return `KES ${Number(amount || 0).toLocaleString()} `;
  };

  /* ======================================================
     EXPORT CSV
  ====================================================== */

  const exportCSV = () => {
    if (!filteredInvoices.length) return;

    const rows = filteredInvoices.map((t) => ({
      Invoice: t.invoice_number || "-",

      Customer: t.customer_name || "-",

      Vehicle: t.plate || "-",

      Service: Array.isArray(t.services)
        ? t.services.map((s: any) => s.name).join(", ")
        : "-",

      Status: t.payment_status || "UNPAID",

      Amount: t.total || 0,

      Date: new Date(t.created_at).toLocaleString(),
    }));

    const csv = [
      Object.keys(rows[0]).join(","),

      ...rows.map((r) => Object.values(r).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "reports.csv";
    a.click();
  };

  /* ======================================================
     KPI CARDS
  ====================================================== */

  const kpiCards: KPI[] = [
    {
      title: "Revenue Today",
      value: formatKES(computed.revenueToday),
      icon: DollarSign,
    },

    {
      title: "Total Revenue",
      value: formatKES(computed.totalRevenue),
      icon: Wallet,
    },

    {
      title: "Expenses",
      value: formatKES(computed.totalExpenses),
      icon: TrendingDown,
    },

    {
      title: "Net Profit",
      value: formatKES(computed.profit),
      icon: TrendingUp,
    },

    {
      title: "Vehicles",
      value: computed.totalVehicles,
      icon: Car,
    },

    {
      title: "Customers",
      value: computed.totalCustomers,
      icon: Users,
    },

    {
      title: "Average Ticket",
      value: formatKES(computed.avgTicket),
      icon: Receipt,
    },

    {
      title: "M-Pesa Revenue",
      value: formatKES(computed.mpesaTotal),
      icon: ShieldCheck,
    },
  ];

  /* ======================================================
     CHART DATA
  ====================================================== */

  const revenueChart = invoices
    .slice(0, 10)
    .reverse()
    .map((t) => ({
      date: new Date(t.created_at).toLocaleDateString(),

      revenue: Number(t.total || 0),
    }));

  const paymentData = [
    {
      name: "M-Pesa",
      value: computed.mpesaTotal,
    },

    {
      name: "Cash",
      value: computed.cashTotal,
    },

    {
      name: "Card",
      value: computed.cardTotal,
    },
  ];

  /* ======================================================
     STATUS BADGE
  ====================================================== */

  const getStatusStyle = (status?: string) => {
    const s = String(status || "paid").toLowerCase();

    if (s === "paid") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }

    if (s === "pending") {
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    }

    if (s === "cancelled") {
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    }

    return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
  };

  /* ======================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <RefreshCw className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-screen bg-[#020617] p-6 text-white">
      <div className="space-y-8">
        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div>
            <h1 className="text-4xl font-black">Reports Dashboard</h1>

            <p className="mt-2 text-white">
              Enterprise Reporting & Financial Intelligence
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={loadReports}
              className="h-9 rounded-xl bg-cyan-500 px-3 text-sm hover:bg-cyan-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              onClick={exportCSV}
              className="rounded-2xl bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* TABS */}

        <div className="flex flex-wrap gap-3">
          {["overview", "invoices", "expenses", "analytics"].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? `${tabStyles[tab as keyof typeof tabStyles]} rounded-2xl bg-current/20 capitalize`
                  : `${tabStyles[tab as keyof typeof tabStyles]} rounded-2xl border bg-transparent capitalize`
              }
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* FILTERS */}

        <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-2xl border-white/10 bg-[#0B1220] text-white"
              />

              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-2xl border-white/10 bg-[#0B1220] text-white"
              />

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white"
              >
                <option value="all">All Branches</option>

                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="absolute top-3 left-3 h-4 w-4 text-white" />

                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-2xl border-white/10 bg-[#0B1220] pl-10 text-white placeholder:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OVERVIEW */}

        {activeTab === "overview" && (
          <>
            {/* ALERTS */}

            {(() => {
              const unpaidInvoices = invoices.filter(
                (i) => String(i.payment_status).toUpperCase() !== "PAID",
              );

              const failedPayments = invoices.filter((i) =>
                String(i.payment_status).toLowerCase().includes("failed"),
              );

              const lowRevenue = computed.revenueToday < 5000;

              const highExpenses =
                computed.totalExpenses > computed.totalRevenue;

              const inactiveCustomers = customers.filter((c) => {
                const customerInvoices = invoices.filter(
                  (i) => i.customer_id === c.id,
                );

                return customerInvoices.length === 0;
              });

              const branchPerformance = branches.map((branch) => {
                const branchRevenue = invoices
                  .filter((i) => i.branch_id === branch.id)
                  .reduce((sum, i) => sum + Number(i.total || 0), 0);

                return {
                  name: branch.name,
                  revenue: branchRevenue,
                };
              });

              const weakBranch = branchPerformance.sort(
                (a, b) => a.revenue - b.revenue,
              )[0];

              const alerts = [
                unpaidInvoices.length > 0 && {
                  title: "Unpaid Invoices",
                  value: `${unpaidInvoices.length} pending payments`,
                  color: "border-yellow-500/20 bg-yellow-500/10",
                  text: "text-yellow-400",
                  icon: AlertCircle,
                },

                failedPayments.length > 0 && {
                  title: "Failed Payments",
                  value: `${failedPayments.length} failed transactions`,
                  color: "border-red-500/20 bg-red-500/10",
                  text: "text-red-400",
                  icon: CreditCard,
                },

                lowRevenue && {
                  title: "Low Daily Revenue",
                  value: "Revenue today below target",
                  color: "border-orange-500/20 bg-orange-500/10",
                  text: "text-orange-400",
                  icon: TrendingDown,
                },

                highExpenses && {
                  title: "Expenses Exceeded Revenue",
                  value: "Business operating at a loss",
                  color: "border-red-500/20 bg-red-500/10",
                  text: "text-red-400",
                  icon: Wallet,
                },

                inactiveCustomers.length > 0 && {
                  title: "Inactive Customers",
                  value: `${inactiveCustomers.length} inactive accounts`,
                  color: "border-violet-500/20 bg-violet-500/10",
                  text: "text-violet-400",
                  icon: Users,
                },

                weakBranch && {
                  title: "Underperforming Branch",
                  value: `${weakBranch.name} below target`,
                  color: "border-cyan-500/20 bg-cyan-500/10",
                  text: "text-cyan-400",
                  icon: Building2,
                },
              ].filter(Boolean) as any[];

              if (!alerts.length) return null;

              return (
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {alerts.map((alert, i) => {
                    const Icon = alert.icon;

                    return (
                      <Card
                        key={i}
                        className={`${alert.color} rounded-3xl border`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p
                                className={`text-sm font-semibold ${alert.text}`}
                              >
                                {alert.title}
                              </p>

                              <h3 className="mt-2 text-lg font-black text-white">
                                {alert.value}
                              </h3>
                            </div>

                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${alert.color}`}
                            >
                              <Icon className={`h-6 w-6 ${alert.text}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}

            {/* KPI */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map((k, i) => {
                const Icon = k.icon;

                const valueColor = k.title.includes("Revenue")
                  ? "text-emerald-400"
                  : k.title.includes("Profit")
                    ? "text-cyan-400"
                    : k.title.includes("Expenses")
                      ? "text-red-400"
                      : k.title.includes("Vehicles")
                        ? "text-yellow-400"
                        : k.title.includes("Customers")
                          ? "text-violet-400"
                          : k.title.includes("Average")
                            ? "text-orange-400"
                            : "text-white";

                return (
                  <Card
                    key={i}
                    className="rounded-3xl border border-white/5 bg-[#040B1A] transition-all hover:border-cyan-500/20"
                  >
                    <CardContent className="flex items-center justify-between p-6">
                      <div>
                        <p className="text-sm text-slate-400">{k.title}</p>

                        <h2
                          className={`mt-2 text-3xl font-black ${valueColor}`}
                        >
                          {k.value}
                        </h2>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
                        <Icon className="h-7 w-7 text-cyan-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* CHARTS */}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <Activity className="text-cyan-400" />

                    <h2 className="text-2xl font-black">Revenue Trend</h2>
                  </div>

                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />

                      <XAxis dataKey="date" stroke="#94A3B8" />

                      <YAxis stroke="#94A3B8" />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#06B6D4"
                        fill="#06B6D4"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <CreditCard className="text-cyan-400" />

                    <h2 className="text-2xl font-black">Payment Analytics</h2>
                  </div>

                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        outerRadius={100}
                        label
                      >
                        <Cell fill="#06B6D4" />
                        <Cell fill="#10B981" />
                        <Cell fill="#F59E0B" />
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* INVOICES */}

        {activeTab === "invoices" && (
          <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
            <CardContent className="overflow-auto p-6">
              <div className="mb-6 flex items-center gap-3">
                <Receipt className="text-cyan-400" />

                <h2 className="text-2xl font-black text-cyan-400">
                  Invoices & Transactions
                </h2>
              </div>

              <table className="w-full min-w-[1000px] text-white">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-4 text-white">Invoice</th>

                    <th className="py-4 text-white">Customer</th>

                    <th className="py-4 text-white">Vehicle</th>

                    <th className="py-4 text-white">Service</th>

                    <th className="py-4 text-white">Payment</th>

                    <th className="py-4 text-white">Status</th>

                    <th className="py-4 text-white">Amount</th>

                    <th className="py-4 text-white">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                    >
                      <td className="py-4 font-medium">
                        {t.invoice_number || `INV-${t.id.slice(0, 6)}`}
                      </td>

                      <td className="py-4">
                        {t.customer || t.customer_name || "-"}
                      </td>

                      <td className="py-4">{t.plate || "-"}</td>

                      <td className="py-4">
                        {Array.isArray(t.services)
                          ? t.services.map((s: any) => s.name).join(", ")
                          : "-"}
                      </td>

                      <td className="py-4">{t.payment_method || "-"}</td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            t.payment_status,
                          )}`}
                        >
                          {t.payment_status || "UNPAID"}
                        </span>
                      </td>

                      <td className="py-4 font-bold text-cyan-400">
                        {formatKES(t.total)}
                      </td>

                      <td className="py-4 text-white">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* EXPENSES */}

        {activeTab === "expenses" && (
          <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
            <CardContent className="overflow-auto p-6">
              <div className="mb-6 flex items-center gap-3">
                <Wallet className="text-red-400" />

                <h2 className="text-2xl font-black text-red-400">
                  Expenses Ledger
                </h2>
              </div>

              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-4 text-white">Category</th>

                    <th className="py-4 text-white">Branch</th>

                    <th className="py-4 text-white">Status</th>

                    <th className="py-4 text-white">Amount</th>

                    <th className="py-4 text-white">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((e, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      <td className="py-4">{e.category || "General"}</td>

                      <td className="py-4">{e.branch_name || "-"}</td>

                      <td className="py-4">
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400">
                          {e.status || "approved"}
                        </span>
                      </td>

                      <td className="py-4 font-bold text-red-400">
                        {formatKES(e.amount)}
                      </td>

                      <td className="py-4 text-white">
                        {e.created_at
                          ? new Date(e.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        {/* ANALYTICS */}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* TOP STATS */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <Building2 className="text-cyan-400" />
                    <h3 className="font-bold text-cyan-400">
                      Revenue By Branch
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {branches.map((branch) => {
                      const branchRevenue = invoices
                        .filter((i) => i.branch_id === branch.id)
                        .reduce((sum, i) => sum + Number(i.total || 0), 0);

                      return (
                        <div
                          key={branch.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-slate-400">{branch.name}</span>

                          <span className="font-bold text-emerald-400">
                            {formatKES(branchRevenue)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <TrendingUp className="text-emerald-400" />

                    <h3 className="font-bold text-emerald-400">
                      Monthly Revenue
                    </h3>
                  </div>

                  <div className="text-4xl font-black text-white">
                    {formatKES(computed.totalRevenue)}
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    Current reporting period
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <Wallet className="text-red-400" />

                    <h3 className="font-bold text-red-400">
                      Profit vs Expenses
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Revenue</span>

                      <span className="font-bold text-emerald-400">
                        {formatKES(computed.totalRevenue)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Expenses</span>

                      <span className="font-bold text-red-400">
                        {formatKES(computed.totalExpenses)}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-white/10 pt-2">
                      <span className="font-bold text-white">Profit</span>

                      <span className="font-black text-cyan-400">
                        {formatKES(computed.profit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <Clock3 className="text-orange-400" />

                    <h3 className="font-bold text-orange-400">Peak Hours</h3>
                  </div>

                  {(() => {
                    const hours: Record<string, number> = {};

                    invoices.forEach((i) => {
                      const hour = new Date(i.created_at).getHours();

                      const key = `${hour}:00`;

                      hours[key] = (hours[key] || 0) + 1;
                    });

                    const topHour = Object.entries(hours).sort(
                      (a, b) => b[1] - a[1],
                    )[0];

                    return (
                      <div>
                        <div className="text-4xl font-black text-white">
                          {topHour?.[0] || "-"}
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          Highest customer activity
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* CHARTS */}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* MONTHLY TREND */}

              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <BarChart3 className="text-cyan-400" />

                    <h2 className="text-2xl font-black text-cyan-400">
                      Revenue Growth
                    </h2>
                  </div>

                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />

                      <XAxis dataKey="date" stroke="#94A3B8" />

                      <YAxis stroke="#94A3B8" />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#06B6D4"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* PAYMENT METHODS */}

              <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <CreditCard className="text-emerald-400" />

                    <h2 className="text-2xl font-black text-emerald-400">
                      Best Payment Method
                    </h2>
                  </div>

                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        outerRadius={110}
                        label
                      >
                        <Cell fill="#06B6D4" />
                        <Cell fill="#10B981" />
                        <Cell fill="#F59E0B" />
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* TOP CUSTOMERS */}

            <Card className="rounded-3xl border border-white/5 bg-[#040B1A]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <BadgeCheck className="text-violet-400" />

                  <h2 className="text-2xl font-black text-violet-400">
                    Top Customers
                  </h2>
                </div>

                <div className="space-y-4">
                  {Object.entries(
                    invoices.reduce((acc: any, invoice) => {
                      const customer =
                        invoice.customer_name || invoice.customer || "Unknown";

                      acc[customer] =
                        (acc[customer] || 0) + Number(invoice.total || 0);

                      return acc;
                    }, {}),
                  )
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, total]: any, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-white/5 pb-3"
                      >
                        <div>
                          <p className="font-semibold text-white">{name}</p>

                          <p className="text-xs text-slate-400">
                            Premium customer
                          </p>
                        </div>

                        <div className="font-black text-emerald-400">
                          {formatKES(total)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
