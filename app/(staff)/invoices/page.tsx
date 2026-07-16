"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Receipt,
  Search,
  User,
  Car,
  Wallet,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Store,
  CheckCircle2,
  Printer,
  FileText,
  Loader2,
  X,
  BadgeCheck,
  CalendarDays,
  Clock3,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ================= TYPES ================= */

type PaymentMethod = "CASH" | "CARD" | "MPESA" | "OTHER";

type Invoice = {
  id: string;
  invoice_number: string;

  customer: string;
  customer_name?: string | null;

  plate: string;

  services?: {
    name: string;
    price: number;
    qty?: number;
  }[];

  subtotal?: number;
  tax?: number;
  vat?: number;
  discount?: number;

  total: number;
  amount_paid?: number;

  payment_status: string;
  payment_method?: string | null;

  status?: string | null;

  paid_at?: string | null;
  created_at: string;

  branch_id?: string | null;
  carwash_id?: string | null;

  cashier?: string | null;
  notes?: string | null;

  branch?: {
    id: string;
    name: string;
    location: string;
    phone: string;
  };

  carwash?: {
    id: string;
    name: string;
  };
};

/* ================= PAGE ================= */

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true);

  const [userBranchId, setUserBranchId] = useState<string | null>(null);

  const [userCarwashId, setUserCarwashId] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [search, setSearch] = useState("");

  const [branchFilter, setBranchFilter] = useState("ALL");
  const [carwashFilter, setCarwashFilter] = useState("ALL");

  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const today = new Date().toISOString().split("T")[0];
  /* ================= FETCH ================= */

  const fetchInvoices = async (
    branchId?: string,
    carwashId?: string,
    date?: string,
  ) => {
    if (!branchId || !carwashId) return;

    setLoading(true);

    try {
      const selected =
        date || selectedDate || new Date().toISOString().split("T")[0];

      const startDate = `${selected}T00:00:00`;
      const endDate = `${selected}T23:59:59.999`;

      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
        *,
        branch:branches(
          id,
          name,
          location,
          phone
        )
      `,
        )
        .eq("branch_id", branchId)
        .eq("carwash_id", carwashId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setInvoices(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserScope();

    const channel = supabase
      .channel("invoice-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
        },
        () => {
          if (userBranchId && userCarwashId) {
            fetchInvoices(userBranchId, userCarwashId, selectedDate);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (userBranchId && userCarwashId) {
      fetchInvoices(userBranchId, userCarwashId, selectedDate);
    }
  }, [selectedDate, userBranchId, userCarwashId]);

  const normalizePlate = (plate: string = "") =>
    plate.toUpperCase().replace(/\s+/g, "").replace(/-/g, "");

  const loadUserScope = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select(
        `
            branch_id,
            carwash_id
        `,
      )
      .eq("id", user.id)
      .single();

    if (!data) {
      setLoading(false);
      return;
    }

    setUserBranchId(data.branch_id);
    setUserCarwashId(data.carwash_id);

    await fetchInvoices(data.branch_id, data.carwash_id, selectedDate);
  };

  /* ================= FILTERS ================= */

  const branchOptions = useMemo(() => {
    return [
      "ALL",
      ...new Set(
        invoices
          .map((i) => i.branch_id)
          .filter(Boolean)
          .map(String),
      ),
    ];
  }, [invoices]);

  const carwashOptions = useMemo(() => {
    return [
      "ALL",
      ...new Set(
        invoices
          .map((i) => i.carwash_id)
          .filter(Boolean)
          .map(String),
      ),
    ];
  }, [invoices]);

  <div className="flex items-center gap-2">
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="h-12 rounded-2xl border border-slate-700 bg-slate-950 px-4"
    />

    <button
      onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
      className="h-12 rounded-2xl bg-cyan-500 px-4 font-semibold text-black"
    >
      Today
    </button>
  </div>;

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const searchMatch =
        invoice.invoice_number?.toLowerCase().includes(q) ||
        invoice.customer?.toLowerCase().includes(q) ||
        normalizePlate(invoice.plate).includes(normalizePlate(q));

      const branchMatch =
        branchFilter === "ALL" || invoice.branch_id === branchFilter;

      const carwashMatch =
        carwashFilter === "ALL" || invoice.carwash_id === carwashFilter;

      return searchMatch && branchMatch && carwashMatch;
    });
  }, [search, invoices, branchFilter, carwashFilter]);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    const totalInvoices = filteredInvoices.length;

    const paidInvoices = filteredInvoices.filter(
      (i) => i.payment_status === "PAID",
    ).length;

    const pendingInvoices = filteredInvoices.filter(
      (i) => i.payment_status !== "PAID",
    ).length;

    const revenue = filteredInvoices.reduce(
      (sum, i) => sum + Number(i.total || 0),
      0,
    );

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      revenue,
    };
  }, [filteredInvoices]);

  /* ================= PAYMENT ================= */

  const confirmPayment = async () => {
    if (!payingInvoice || !paymentMethod) return;

    try {
      setProcessingId(payingInvoice.id);

      const { error } = await supabase
        .from("invoices")
        .update({
          payment_status: "PAID",
          payment_method: paymentMethod,
          amount_paid: payingInvoice.total,
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", payingInvoice.id);

      if (error) {
        console.error("PAYMENT ERROR:", error);
        alert(error.message);
        return;
      }

      setPayingInvoice(null);
      setPaymentMethod(null);

      await fetchInvoices(
        userBranchId || undefined,
        userCarwashId || undefined,
        selectedDate,
      );
    } catch (err) {
      console.error(err);
      alert("Failed to process payment");
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= PRINT ================= */

  const printReceipt = (invoice: Invoice) => {
    setPrintingInvoice(invoice);
  };

  //stats
  type MiniStatCardProps = {
    title: string;
    value: string | number;
    icon: any;
    color: "cyan" | "emerald" | "amber" | "violet";
  };

  function MiniStatCard({
    title,
    value,
    icon: Icon,
    color,
  }: MiniStatCardProps) {
    const styles = {
      cyan: {
        border: "border-cyan-500/15",
        bg: "from-cyan-500/10 via-cyan-500/5 to-transparent",
        icon: "text-cyan-400 bg-cyan-500/10",
        value: "text-cyan-300",
        glow: "bg-cyan-500/10",
      },

      emerald: {
        border: "border-emerald-500/15",
        bg: "from-emerald-500/10 via-emerald-500/5 to-transparent",
        icon: "text-emerald-400 bg-emerald-500/10",
        value: "text-emerald-300",
        glow: "bg-emerald-500/10",
      },

      amber: {
        border: "border-amber-500/15",
        bg: "from-amber-500/10 via-amber-500/5 to-transparent",
        icon: "text-amber-400 bg-amber-500/10",
        value: "text-amber-300",
        glow: "bg-amber-500/10",
      },

      violet: {
        border: "border-violet-500/15",
        bg: "from-violet-500/10 via-violet-500/5 to-transparent",
        icon: "text-violet-400 bg-violet-500/10",
        value: "text-violet-300",
        glow: "bg-violet-500/10",
      },
    };

    const s = styles[color];

    return (
      <div
        className={`group relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-br ${s.bg} p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5`}
      >
        {/* Glow */}
        <div
          className={`absolute -top-6 -right-6 h-14 w-14 rounded-full blur-2xl ${s.glow}`}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              {title}
            </p>

            <h3
              className={`mt-1 truncate text-sm font-black sm:text-base ${s.value}`}
            >
              {value}
            </h3>
          </div>

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${s.icon} `}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  /* ================= Date Picker ================= */
  <div className="flex h-12 items-center gap-3 rounded-2xl border border-cyan-500/15 bg-gradient-to-r from-[#081A33] to-[#071420] px-4 shadow-inner shadow-black/20 transition-all duration-300 hover:border-cyan-500/30">
    <CalendarDays className="h-5 w-5 shrink-0 text-cyan-400" />

    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="h-full flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-white [color-scheme:dark] outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:transition hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-day-field]:text-white [&::-webkit-datetime-edit-fields-wrapper]:text-white [&::-webkit-datetime-edit-month-field]:text-white [&::-webkit-datetime-edit-year-field]:text-white [&::-webkit-inner-spin-button]:hidden"
    />
  </div>;

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-180px] left-[-180px] h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]" />

        <div className="absolute right-[-180px] bottom-[-180px] h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,.05),transparent_60%)]" />
      </div>

      {/* Page Container */}

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* =========================================
    HEADER
    ========================================= */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-[#061226] via-[#081A33] to-[#0B1220] p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          {/* Left Side */}

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              <Receipt className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Invoice Management
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Multi Branch • Multi Carwash
              </p>
            </div>
          </div>

          {/* Right Side */}

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
            <p className="text-xs tracking-wider text-cyan-300 uppercase">
              Viewing Date
            </p>

            <p className="mt-1 text-base font-semibold text-white">
              {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="mb-5 grid grid-cols-4 gap-2">
          <MiniStatCard
            title="Invoices"
            value={stats.totalInvoices}
            color="cyan"
            icon={Receipt}
          />

          <MiniStatCard
            title="Paid"
            value={stats.paidInvoices}
            color="emerald"
            icon={CheckCircle2}
          />

          <MiniStatCard
            title="Pending"
            value={stats.pendingInvoices}
            color="amber"
            icon={Clock3}
          />

          <MiniStatCard
            title="Revenue"
            value={`KSh ${stats.revenue.toLocaleString()}`}
            color="violet"
            icon={Wallet}
          />
        </div>

        {/* =========================================
        FILTERS
        ========================================= */}

        <div className="mb-6 rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#09182D] to-[#071420] p-4 shadow-[0_20px_50px_rgba(0,0,0,.30)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* ================= Search ================= */}

            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-cyan-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, customer or vehicle..."
                className="h-12 w-full rounded-2xl border border-cyan-500/15 bg-slate-950/60 pr-4 pl-12 text-sm font-medium text-white transition-all duration-300 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950 focus:ring-4 focus:ring-cyan-500/10"
              />
            </div>

            {/* ================= Date + Today ================= */}

            <div className="flex gap-3 sm:flex-row">
              {/* Date */}

              <div className="relative flex h-12 w-full items-center rounded-2xl border border-cyan-500/15 bg-slate-950/70 px-4 transition-all duration-300 hover:border-cyan-400/30 sm:w-[220px]">
                <CalendarDays className="mr-3 h-5 w-5 shrink-0 text-cyan-400" />

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-full w-full border-0 bg-transparent p-0 text-sm font-semibold text-white outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-day-field]:text-white [&::-webkit-datetime-edit-fields-wrapper]:text-white [&::-webkit-datetime-edit-month-field]:text-white [&::-webkit-datetime-edit-year-field]:text-white"
                />
              </div>

              {/* Today */}

              <Button
                onClick={() => setSelectedDate(today)}
                className="h-12 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-sky-600 px-5 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/40"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Today
              </Button>
            </div>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        )}

        {/* =========================================
        EMPTY STATE
        ========================================= */}

        {!loading && filteredInvoices.length === 0 && (
          <div className="flex justify-center py-12 sm:py-20">
            <div className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#071420] p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,.35)]">
              {/* Glow */}
              <div className="absolute -top-20 right-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative">
                {/* Icon */}

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10 shadow-[0_0_35px_rgba(34,211,238,.12)]">
                  <Receipt className="h-10 w-10 text-cyan-400" />
                </div>

                {/* Title */}

                <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
                  No Invoices Found
                </h2>

                {/* Description */}

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                  No invoices match your current search or selected date. Try
                  changing your filters or return to today's invoices.
                </p>

                {/* Active Filters */}

                {(search || selectedDate !== today) && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {search && (
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        Search: "{search}"
                      </span>
                    )}

                    {selectedDate !== today && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                        {selectedDate}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => {
                      setSearch("");
                      setSelectedDate(today);
                    }}
                    className="h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/40"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Filters
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      fetchInvoices(userBranchId!, userCarwashId!, selectedDate)
                    }
                    className="h-12 rounded-2xl border-slate-700 bg-slate-900/60 font-semibold text-slate-300 transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-300"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================
        INVOICES
        ========================= */}

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="group relative overflow-hidden rounded-[24px] border border-slate-800/60 bg-gradient-to-br from-[#07111F] via-[#0B1628] to-[#081426] p-4 shadow-[0_10px_35px_rgba(0,0,0,.28)] transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_18px_45px_rgba(6,182,212,.12)]"
            >
              {/* Cyan Glow */}

              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl transition-all duration-500 group-hover:bg-cyan-400/15" />

              {/* Bottom Accent */}

              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Your invoice content here */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0A1324] via-[#0B172B] to-[#081A33] p-5">
                {/* Glow */}

                <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="relative flex items-start justify-between">
                  {/* LEFT */}

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                      <Receipt className="h-6 w-6 text-cyan-400" />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                        Receipt
                      </p>

                      <h2 className="mt-1 text-xl font-black text-white">
                        {invoice.invoice_number}
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(invoice.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                        invoice.payment_status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          invoice.payment_status === "PAID"
                            ? "bg-emerald-400"
                            : "bg-amber-400"
                        }`}
                      />

                      {invoice.payment_status}
                    </div>

                    <h1 className="mt-4 text-3xl font-black text-cyan-400">
                      KSh {Number(invoice.total).toLocaleString()}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div>
                  <p className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">
                    Customer
                  </p>

                  <p className="mt-1 truncate font-semibold text-white">
                    {invoice.customer || "Walk-in Customer"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">
                    Vehicle
                  </p>

                  <p className="mt-1 truncate font-semibold text-white">
                    {invoice.plate || "No Plate"}
                  </p>
                </div>
              </div>

              {/* =========================
              SERVICES
              ========================= */}

              <div className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-3">
                {/* Header */}

                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold tracking-[0.25em] text-cyan-400 uppercase">
                    Services
                  </h4>

                  {Array.isArray((invoice as any).services) && (
                    <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">
                      {(invoice as any).services.length} Item
                      {(invoice as any).services.length !== 1 && "s"}
                    </span>
                  )}
                </div>

                {Array.isArray((invoice as any).services) &&
                (invoice as any).services.length > 0 ? (
                  <div className="divide-y divide-slate-800/70">
                    {(invoice as any).services.map(
                      (service: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                        >
                          {/* Left */}

                          <div className="flex min-w-0 items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

                            <span className="truncate text-sm font-medium text-slate-200">
                              {service.name}
                            </span>
                          </div>

                          {/* Price */}

                          <span className="ml-4 text-sm font-bold whitespace-nowrap text-emerald-400">
                            KSh {Number(service.price).toLocaleString()}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 py-5 text-center">
                    <p className="text-sm text-slate-500">
                      No services recorded
                    </p>
                  </div>
                )}
              </div>

              {/* =========================
              PAYMENT SUMMARY
              ========================= */}

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-[#08111F] to-[#07142B]">
                {/* Summary Rows */}

                <div className="space-y-1.5 p-3">
                  {[
                    {
                      label: "Subtotal",
                      value: invoice.subtotal || invoice.total,
                    },
                    {
                      label: "Tax",
                      value: invoice.tax || 0,
                    },
                    {
                      label: "Discount",
                      value: invoice.discount || 0,
                    },
                    {
                      label: "Paid",
                      value: invoice.amount_paid || 0,
                      color: "text-emerald-400",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg px-1 py-1.5"
                    >
                      <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                        {item.label}
                      </span>

                      <span
                        className={`text-sm font-semibold ${
                          item.color ?? "text-slate-200"
                        }`}
                      >
                        KSh {Number(item.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}

                <div className="border-t border-cyan-500/10 bg-cyan-500/[0.04] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.25em] text-cyan-400 uppercase">
                        Total
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Final Amount
                      </p>
                    </div>

                    <h2 className="text-2xl font-black text-cyan-400">
                      KSh {Number(invoice.total).toLocaleString()}
                    </h2>
                  </div>
                </div>
              </div>

              {/* =========================================
              CASHIER & NOTES
              ========================================= */}
              <div className="mt-4 space-y-2.5">
                {/* Cashier */}

                {invoice.cashier && (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-gradient-to-r from-slate-950/90 via-[#08111F] to-[#07142B] px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
                        <User className="h-4 w-4 text-cyan-400" />
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.25em] text-slate-500 uppercase">
                          Cashier
                        </p>

                        <p className="text-sm font-semibold text-white">
                          {invoice.cashier}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />

                      <span className="text-[11px] font-semibold text-emerald-300">
                        Verified
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}

                {invoice.notes && (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 px-3 py-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-400" />

                      <span className="text-[10px] font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                        Notes
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-300">
                      {invoice.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* =========================================
               ACTION BUTTONS
               ========================================= */}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* ================= Print Receipt ================= */}

                <button
                  onClick={() => printReceipt(invoice)}
                  className="group relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-[#091423] via-[#0B172A] to-[#07111F] px-5 py-4 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_15px_35px_rgba(34,211,238,.15)] active:scale-[0.98]"
                >
                  {/* Glow */}

                  <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl transition group-hover:bg-cyan-400/20" />

                  <div className="relative flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 transition-all group-hover:scale-110 group-hover:rotate-6">
                      <Printer className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div className="text-left">
                      <p className="text-xs tracking-[0.25em] text-slate-500 uppercase">
                        Receipt
                      </p>

                      <h4 className="font-bold text-white">Print Receipt</h4>
                    </div>
                  </div>
                </button>

                {/* ================= Payment ================= */}

                {invoice.payment_status !== "PAID" ? (
                  <button
                    onClick={() => setPayingInvoice(invoice)}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-5 py-4 shadow-[0_15px_40px_rgba(16,185,129,.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(16,185,129,.45)] active:scale-[0.98]"
                  >
                    {/* Glow */}

                    <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 transition-all group-hover:scale-110 group-hover:rotate-6">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>

                      <div className="text-left">
                        <p className="text-xs tracking-[0.25em] text-emerald-100 uppercase">
                          Payment
                        </p>

                        <h4 className="font-bold text-white">
                          Complete Payment
                        </h4>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent px-5 py-4">
                    {/* Animated Glow */}

                    <div className="absolute top-1/2 left-5 h-3 w-3 -translate-y-1/2 animate-pulse rounded-full bg-emerald-400" />

                    <div className="ml-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs tracking-[0.25em] text-emerald-300 uppercase">
                          Status
                        </p>

                        <h4 className="font-bold text-emerald-400">
                          Payment Completed
                        </h4>
                      </div>

                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* =========================================
    PAYMENT MODAL
========================================= */}

        {payingInvoice && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#020617]/85 backdrop-blur-xl">
            <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
              {" "}
              {/* Center Container */}
              <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
                <div className="animate-in fade-in zoom-in-95 relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-[#081A33] via-[#091B34] to-[#07142B] shadow-[0_35px_120px_rgba(0,0,0,.65)] backdrop-blur-2xl duration-300">
                  <div className="animate-in zoom-in-95 fade-in relative w-full max-w-3xl overflow-hidden rounded-[34px] border border-cyan-500/20 bg-gradient-to-br from-[#081A33] via-[#09172D] to-[#050B18] shadow-[0_40px_120px_rgba(0,0,0,.65)] duration-300">
                    {/* =========================================
                    HEADER
                    ========================================= */}

                    <div className="relative overflow-hidden border-b border-white/10 px-5 py-4">
                      {/* Background Glow */}

                      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

                      <div className="relative flex items-center justify-between">
                        {/* Left */}

                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,.08)]">
                            <Wallet className="h-6 w-6 text-cyan-400" />
                          </div>

                          <div>
                            <h2 className="text-2xl font-black tracking-tight text-white">
                              Complete Payment
                            </h2>

                            <p className="mt-0.5 text-sm text-slate-400">
                              Select a payment method to complete this invoice.
                            </p>
                          </div>
                        </div>

                        {/* Close */}

                        <button
                          onClick={() => setPayingInvoice(null)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <X className="h-4.5 w-4.5 text-slate-400 transition-colors group-hover:text-red-300" />
                        </button>
                      </div>
                    </div>

                    {/* =========================================
                    INVOICE SUMMARY
                    ========================================= */}

                    <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#081A33] to-slate-950 p-4">
                      <div className="rounded-2xl border border-cyan-500/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-4">
                          {/* LEFT */}

                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                              <Receipt className="h-6 w-6 text-cyan-400" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                                Invoice
                              </p>

                              <h3 className="truncate text-lg font-black text-white">
                                {payingInvoice.invoice_number}
                              </h3>

                              <p className="truncate text-xs text-slate-400">
                                {new Date(
                                  payingInvoice.created_at,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* RIGHT */}

                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                              Amount
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-emerald-400">
                              KSh {Number(payingInvoice.total).toLocaleString()}
                            </h2>

                            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
                              <Wallet className="h-3.5 w-3.5 text-emerald-400" />

                              <span className="text-[10px] font-bold tracking-wide text-emerald-300 uppercase">
                                Ready
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* =========================================
                    PAYMENT METHODS
                    ========================================= */}

                    <div className="space-y-3 px-5 pb-5">
                      <p className="text-[11px] font-bold tracking-[0.25em] text-cyan-300 uppercase">
                        Payment Method
                      </p>

                      {[
                        {
                          id: "CASH",
                          icon: Banknote,
                          label: "Cash",
                          subtitle: "Cash Payment",
                        },
                        {
                          id: "CARD",
                          icon: CreditCard,
                          label: "Card",
                          subtitle: "Debit / Credit",
                        },
                        {
                          id: "MPESA",
                          icon: Smartphone,
                          label: "M-Pesa",
                          subtitle: "Mobile Money",
                        },
                        {
                          id: "OTHER",
                          icon: Wallet,
                          label: "Other",
                          subtitle: "Alternative",
                        },
                      ].map((method) => {
                        const Icon = method.icon;
                        const selected = paymentMethod === method.id;

                        return (
                          <button
                            key={method.id}
                            onClick={() =>
                              setPaymentMethod(method.id as PaymentMethod)
                            }
                            className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-300 ${
                              selected
                                ? `border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,.15)] ring-1 ring-cyan-500/20`
                                : `border-slate-700 bg-slate-900/70 hover:border-cyan-500/20 hover:bg-slate-800`
                            } `}
                          >
                            {/* Left */}

                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                  selected
                                    ? "bg-cyan-500 text-white"
                                    : "bg-slate-800 text-cyan-400"
                                } `}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="text-left leading-tight">
                                <h4 className="text-[15px] font-semibold text-white">
                                  {method.label}
                                </h4>

                                <p className="text-xs text-slate-400">
                                  {method.subtitle}
                                </p>
                              </div>
                            </div>

                            {/* Right */}

                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                                selected
                                  ? "border-cyan-400 bg-cyan-400"
                                  : "border-slate-600"
                              } `}
                            >
                              {selected && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* =========================================
    FOOTER
========================================= */}

                    <div className="border-t border-white/10 bg-gradient-to-r from-[#07142B] via-[#081A33] to-[#07142B] px-5 py-4">
                      <div className="flex gap-3">
                        {/* Cancel */}

                        <button
                          onClick={() => setPayingInvoice(null)}
                          className="flex h-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/50 px-6 font-semibold text-slate-300 transition-all duration-300 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                        >
                          Cancel
                        </button>

                        {/* Confirm */}

                        <button
                          onClick={confirmPayment}
                          disabled={
                            !paymentMethod || processingId === payingInvoice.id
                          }
                          className="group relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-3 font-bold text-white shadow-[0_10px_30px_rgba(6,182,212,.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(6,182,212,.40)] disabled:pointer-events-none disabled:opacity-40"
                        >
                          {/* Animated Shine */}

                          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                          <span className="relative flex items-center justify-center gap-2">
                            <Wallet className="h-4.5 w-4.5" />

                            {processingId === payingInvoice.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Complete Payment"
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================
    RECEIPT PREVIEW
========================================= */}

      {printingInvoice && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-cyan-500/20 bg-gradient-to-b from-[#081A33] to-[#071420] shadow-[0_30px_100px_rgba(0,0,0,.65)]">
            {/* Header */}

            <div className="no-print border-b border-white/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-[0.3em] text-cyan-400 uppercase">
                    Receipt Preview
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-white">
                    {printingInvoice.invoice_number}
                  </h2>
                </div>

                <button
                  onClick={() => setPrintingInvoice(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 hover:border-red-500 hover:bg-red-500/10"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Receipt */}

            <div
              id="receipt-print"
              className="max-h-[65vh] overflow-y-auto bg-white p-6 text-black"
            >
              <div className="text-center">
                <h2 className="text-2xl font-black">
                  {printingInvoice.branch?.name || "WashFlow Pro"}
                </h2>

                <p className="text-sm text-gray-500">
                  {printingInvoice.branch?.location}
                </p>

                <p className="text-sm text-gray-500">
                  {printingInvoice.branch?.phone}
                </p>

                <div className="my-4 border-t border-dashed" />
              </div>

              <Info label="Invoice" value={printingInvoice.invoice_number} />

              <Info
                label="Date"
                value={new Date(printingInvoice.created_at).toLocaleString()}
              />

              <Info label="Customer" value={printingInvoice.customer} />

              <Info label="Vehicle" value={printingInvoice.plate} />

              <Info label="Cashier" value={printingInvoice.cashier || "-"} />

              <div className="my-4 border-t border-dashed" />

              {printingInvoice.services?.map((service, index) => (
                <div key={index} className="mb-2 flex justify-between text-sm">
                  <span>{service.name}</span>

                  <span>KSh {Number(service.price).toLocaleString()}</span>
                </div>
              ))}

              <div className="my-4 border-t border-dashed" />

              <Info
                label="Subtotal"
                value={`KSh ${Number(
                  printingInvoice.subtotal || printingInvoice.total,
                ).toLocaleString()}`}
              />

              <Info
                label="Tax"
                value={`KSh ${Number(printingInvoice.tax || 0).toLocaleString()}`}
              />

              <Info
                label="Discount"
                value={`KSh ${Number(
                  printingInvoice.discount || 0,
                ).toLocaleString()}`}
              />

              <div className="my-4 border-t border-dashed" />

              <div className="flex justify-between text-xl font-black">
                <span>Total</span>

                <span>
                  KSh {Number(printingInvoice.total).toLocaleString()}
                </span>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                Thank you for choosing us.
              </div>
            </div>

            {/* Footer */}

            <div className="no-print border-t border-white/10 bg-[#071420] p-5">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPrintingInvoice(null)}
                  className="h-11 rounded-2xl"
                >
                  Close
                </Button>

                <Button
                  onClick={() => {
                    const w = window.open("", "_blank", "width=420,height=900");

                    if (!w) return;

                    const services =
                      printingInvoice.services
                        ?.map(
                          (s) => `
                          <tr>
                          <td>${s.name}</td>
                          <td style="text-align:right">
                          KSh ${Number(s.price).toLocaleString()}
                          </td>
                          </tr>
                          `,
                        )
                        .join("") || "";
                    w.document.write(`
                          <!DOCTYPE html>
                          <html>
                          
                          <head>
                          <title>${printingInvoice.invoice_number}</title>
                          <style>
                          *{
                          box-sizing:border-box;
                          margin:0;
                          padding:0;
                          font-family:Arial,Helvetica,sans-serif;
                          }

body{
padding:18px;
color:#111;
font-size:13px;
background:#fff;
}

.receipt{
max-width:320px;
margin:auto;
}

.center{
text-align:center;
}

h1{
font-size:22px;
margin-bottom:6px;
}

.small{
font-size:12px;
color:#666;
}

.line{
border-top:1px dashed #777;
margin:14px 0;
}

table{
width:100%;
border-collapse:collapse;
}

td{
padding:4px 0;
font-size:13px;
}

.right{
text-align:right;
}

.total{
font-size:18px;
font-weight:700;
}

.footer{
margin-top:18px;
text-align:center;
font-size:12px;
color:#666;
line-height:1.7;
}

@media print{

body{
padding:0;
}

}

</style>

</head>

<body>

<div class="receipt">

<div class="center">

<h1>${printingInvoice.branch?.name || "WashFlow Pro"}</h1>

<div class="small">
${printingInvoice.branch?.location || ""}
</div>

<div class="small">
${printingInvoice.branch?.phone || ""}
</div>

</div>

<div class="line"></div>

<table>

<tr>
<td>Invoice</td>
<td class="right">${printingInvoice.invoice_number}</td>
</tr>

<tr>
<td>Date</td>
<td class="right">
${new Date(printingInvoice.created_at).toLocaleString()}
</td>
</tr>

<tr>
<td>Customer</td>
<td class="right">${printingInvoice.customer}</td>
</tr>

<tr>
<td>Vehicle</td>
<td class="right">${printingInvoice.plate}</td>
</tr>

<tr>
<td>Cashier</td>
<td class="right">${printingInvoice.cashier || "-"}</td>
</tr>

</table>

<div class="line"></div>

<table>

<tr>
<td colspan="2" style="font-weight:bold">
SERVICES
</td>
</tr>

${services}

</table>

<div class="line"></div>

<table>

<tr>
<td>Subtotal</td>
<td class="right">
KSh ${Number(printingInvoice.subtotal || printingInvoice.total).toLocaleString()}
</td>
</tr>

<tr>
<td>Tax</td>
<td class="right">
KSh ${Number(printingInvoice.tax || 0).toLocaleString()}
</td>
</tr>

<tr>
<td>Discount</td>
<td class="right">
KSh ${Number(printingInvoice.discount || 0).toLocaleString()}
</td>
</tr>

</table>

<div class="line"></div>

<table>

<tr class="total">
<td>TOTAL</td>
<td class="right">
KSh ${Number(printingInvoice.total).toLocaleString()}
</td>
</tr>

</table>

<div class="line"></div>

<table>

<tr>
<td>Payment</td>
<td class="right">
${printingInvoice.payment_method || "Pending"}
</td>
</tr>

<tr>
<td>Status</td>
<td class="right">
${printingInvoice.payment_status}
</td>
</tr>

</table>

<div class="footer">

Thank you for choosing us.<br>

Powered by <b>WashFlow Pro</b>

</div>

</div>

<script>

window.onload=()=>{

window.print();

setTimeout(()=>window.close(),300);

}

</script>

</body>

</html>
`);

                    w.document.close();
                  }}
                  className="h-11 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENT ================= */

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>

      <h3 className="mt-2 text-3xl font-black">{value}</h3>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>

      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
