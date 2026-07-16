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

      const startDate = new Date(`${selected}T00:00:00`);
      const endDate = new Date(`${selected}T23:59:59`);

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
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
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
            fetchInvoices(userBranchId, userCarwashId);
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

    await fetchInvoices(data.branch_id, data.carwash_id);
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
    const html = `
<html>
<head>
<title>${invoice.invoice_number}</title>

<style>
body{
  font-family:Arial;
  padding:20px;
  color:#111;
}

.header{
  text-align:center;
}

.line{
  border-top:1px dashed #999;
  margin:10px 0;
}

.row{
  display:flex;
  justify-content:space-between;
  margin:5px 0;
}

.total{
  font-size:20px;
  font-weight:bold;
}

.small{
  font-size:12px;
  color:#555;
}
</style>

</head>

<body>

<div class="header">

<h2>${invoice.branch?.name || "Main Branch"}</h2>

<p>
${invoice.branch?.location || ""}
</p>

<p>
${invoice.branch?.phone || ""}
</p>

<h3>CAR WASH RECEIPT</h3>

</div>

<div class="line"></div>

<div class="row">
<span>Invoice</span>
<span>${invoice.invoice_number}</span>
</div>

<div class="row">
<span>Date</span>
<span>${new Date(invoice.created_at).toLocaleString()}</span>
</div>

<div class="row">
<span>Customer</span>
<span>${invoice.customer}</span>
</div>

<div class="row">
<span>Vehicle</span>
<span>${invoice.plate}</span>
</div>

<div class="row">
<span>Cashier</span>
<span>${invoice.cashier || "-"}</span>
</div>

<div class="line"></div>

${
  invoice.services
    ?.map(
      (s) => `
<div class="row">
<span>${s.name}</span>
<span>KSh ${s.price}</span>
</div>
`,
    )
    .join("") || ""
}

<div class="line"></div>

<div class="row">
<span>Subtotal</span>
<span>KSh ${invoice.subtotal || invoice.total}</span>
</div>

<div class="row">
<span>Tax</span>
<span>KSh ${invoice.tax || 0}</span>
</div>

<div class="row">
<span>Discount</span>
<span>KSh ${invoice.discount || 0}</span>
</div>

<div class="row total">
<span>Total</span>
<span>KSh ${invoice.total}</span>
</div>

<div class="line"></div>

<div class="row">
<span>Payment</span>
<span>${invoice.payment_method || "Pending"}</span>
</div>

<div class="row">
<span>Status</span>
<span>${invoice.payment_status}</span>
</div>

<p class="small">
Thank you for choosing us.
</p>

</body>
</html>
`;

    const win = window.open("", "_blank");

    if (!win) return;

    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };
  /* ================= Date Picker ================= */
  <input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    className="h-12 rounded-xl border border-white/10 bg-[#111827] px-4"
  />;

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

        <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <StatCard title="Invoices" value={stats.totalInvoices} />

          <StatCard title="Paid" value={stats.paidInvoices} />

          <StatCard title="Pending" value={stats.pendingInvoices} />

          <StatCard
            title="Revenue"
            value={`KSh ${stats.revenue.toLocaleString()}`}
          />
        </div>

        {/* =========================================
    FILTERS
========================================= */}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-[#08121F]/90 p-4 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}

            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, customer or plate..."
                className="h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 pr-4 pl-12 text-white transition outline-none placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Date Controls */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-3">
                <label className="text-sm whitespace-nowrap text-slate-400">
                  Date
                </label>

                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 w-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
              </div>

              <Button
                onClick={() => setSelectedDate(today)}
                className="h-12 rounded-2xl bg-cyan-500 px-6 font-semibold text-slate-950 hover:bg-cyan-400"
              >
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

        {!loading && filteredInvoices.length === 0 && (
          <div className="flex justify-center py-16 sm:py-24">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#081A33] p-8 text-center shadow-xl">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10">
                <Receipt className="h-10 w-10 text-cyan-400" />
              </div>

              <h2 className="mt-6 text-2xl font-black text-white">
                No Invoices Found
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
                We couldn't find any invoices matching your current search or
                selected date. Try changing the filters or selecting another
                date.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedDate(today);
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 font-semibold text-white transition hover:scale-[1.02]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Filters
                </button>

                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedDate(today);
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 font-semibold text-white transition hover:scale-[1.02]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INVOICES */}

        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#081A33] p-5 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                    <Receipt className="h-7 w-7 text-cyan-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
                      Invoice
                    </p>

                    <h2 className="mt-1 text-xl font-black tracking-tight text-white">
                      {invoice.invoice_number}
                    </h2>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <CalendarDays className="h-4 w-4 text-cyan-400" />

                      <span>
                        {new Date(invoice.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start sm:justify-end">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                      invoice.payment_status === "PAID"
                        ? "border-green-500/20 bg-green-500/10 text-green-400"
                        : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                    }`}
                  >
                    {invoice.payment_status === "PAID" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock3 className="h-4 w-4" />
                    )}

                    {invoice.payment_status}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-[#081A33] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                    <User className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Customer
                    </p>

                    <p className="truncate font-semibold text-white">
                      {invoice.customer || "Walk-in Customer"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-[#081A33] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Car className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Vehicle
                    </p>

                    <p className="truncate font-semibold text-white">
                      {invoice.plate || "No Plate"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-[#081A33] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Branch
                    </p>

                    <p className="truncate font-semibold text-white">
                      {invoice.branch?.name || "No Branch"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-[#081A33] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Store className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Carwash
                    </p>

                    <p className="truncate font-semibold text-white">
                      {invoice.carwash_id || "No Carwash"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="mb-3 text-xs font-semibold tracking-widest text-cyan-400 uppercase">
                  Services
                </p>

                {(invoice.services ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {Array.isArray((invoice as any).services) &&
                    (invoice as any).services.length > 0 ? (
                      <div className="space-y-2">
                        {(invoice as any).services.map(
                          (service: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                                <span>{service.name}</span>
                              </div>

                              <span>
                                KSh {Number(service.price).toLocaleString()}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No services recorded.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No services recorded.
                  </p>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-950 p-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>KSh {invoice.subtotal || invoice.total}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>KSh {invoice.tax || 0}</span>
                </div>

                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>KSh {invoice.discount || 0}</span>
                </div>

                <div className="flex justify-between">
                  <span>Paid</span>
                  <span>KSh {invoice.amount_paid || 0}</span>
                </div>

                <div className="mt-3 flex justify-between border-t border-slate-700 pt-3">
                  <span>Total</span>

                  <span className="font-black text-cyan-400">
                    KSh {invoice.total}
                  </span>
                </div>
              </div>

              {/* =========================================
              CASHIER & NOTES
              ========================================= */}

              <div className="mt-5 space-y-3">
                {/* Cashier */}

                {invoice.cashier && (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-[#081A33] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <User className="h-5 w-5 text-cyan-400" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                          Cashier
                        </p>

                        <h4 className="mt-1 font-semibold text-white">
                          {invoice.cashier}
                        </h4>
                      </div>
                    </div>

                    <BadgeCheck className="h-5 w-5 text-green-400" />
                  </div>
                )}

                {/* Notes */}

                {invoice.notes && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-cyan-400" />

                      <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                        Notes
                      </p>
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

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Print */}

                <button
                  onClick={() => printReceipt(invoice)}
                  className="group flex h-14 items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98]"
                >
                  <Printer className="h-5 w-5 text-cyan-400 transition group-hover:scale-110" />

                  <span>Print Receipt</span>
                </button>

                {/* Payment */}

                {invoice.payment_status !== "PAID" ? (
                  <button
                    onClick={() => setPayingInvoice(invoice)}
                    className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold text-white shadow-lg shadow-green-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98]"
                  >
                    <Wallet className="h-5 w-5 transition group-hover:scale-110" />

                    <span>Complete Payment</span>
                  </button>
                ) : (
                  <div className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 font-semibold text-green-400">
                    <CheckCircle2 className="h-5 w-5" />

                    <span>Payment Completed</span>
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
                    {/* Header */}

                    <div className="relative overflow-hidden border-b border-white/10 px-8 py-7">
                      <div className="absolute top-0 right-0 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />

                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10">
                            <Wallet className="h-8 w-8 text-cyan-400" />
                          </div>

                          <div>
                            <h2 className="text-3xl font-black text-white">
                              Complete Payment
                            </h2>

                            <p className="mt-1 text-slate-400">
                              Verify the invoice and choose a payment method.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setPayingInvoice(null)}
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 transition hover:border-red-500 hover:bg-red-500/10"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* =========================================
                    INVOICE SUMMARY
                    ========================================= */}

                    <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#081A33] to-slate-950 p-5">
                      <div className="rounded-2xl border border-cyan-500/10 bg-white/[0.03] p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                          {/* Left */}

                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                              <Receipt className="h-7 w-7 text-cyan-400" />
                            </div>

                            <div>
                              <p className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
                                Invoice Number
                              </p>

                              <h3 className="mt-1 text-xl font-black text-white">
                                {payingInvoice.invoice_number}
                              </h3>

                              <p className="mt-1 text-sm text-slate-400">
                                {new Date(
                                  payingInvoice.created_at,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Right */}

                          <div className="text-left sm:text-right">
                            <p className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
                              Amount Due
                            </p>

                            <h2 className="mt-2 text-3xl font-black text-green-400">
                              KSh {Number(payingInvoice.total).toLocaleString()}
                            </h2>

                            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
                              <Wallet className="h-4 w-4 text-green-400" />

                              <span className="text-xs font-semibold text-green-300">
                                Ready for Payment
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}

                    <div className="space-y-3 p-5">
                      <p className="text-xs font-semibold tracking-widest text-cyan-300 uppercase">
                        Payment Method
                      </p>

                      {[
                        {
                          id: "CASH",
                          icon: Banknote,
                          label: "Cash",
                          subtitle: "Receive payment in cash",
                        },
                        {
                          id: "CARD",
                          icon: CreditCard,
                          label: "Card",
                          subtitle: "Debit or Credit Card",
                        },
                        {
                          id: "MPESA",
                          icon: Smartphone,
                          label: "M-Pesa",
                          subtitle: "Pay using M-Pesa",
                        },
                        {
                          id: "OTHER",
                          icon: Wallet,
                          label: "Other",
                          subtitle: "Other payment method",
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
                            className={`group flex w-full items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${
                              selected
                                ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20"
                                : "border-slate-700 bg-slate-900 hover:border-cyan-400 hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                  selected
                                    ? "bg-cyan-500 text-white"
                                    : "bg-slate-800 text-cyan-400"
                                }`}
                              >
                                <Icon className="h-6 w-6" />
                              </div>

                              <div className="text-left">
                                <h4 className="font-semibold text-white">
                                  {method.label}
                                </h4>

                                <p className="text-sm text-slate-400">
                                  {method.subtitle}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`h-5 w-5 rounded-full border-2 transition ${
                                selected
                                  ? "border-cyan-400 bg-cyan-400"
                                  : "border-slate-600"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer */}

                    <div className="border-t border-slate-800 bg-[#07142B] p-5">
                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button
                          onClick={() => setPayingInvoice(null)}
                          className="flex-1 rounded-2xl border border-slate-700 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={confirmPayment}
                          disabled={
                            !paymentMethod || processingId === payingInvoice.id
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Wallet className="h-5 w-5" />

                          {processingId === payingInvoice.id
                            ? "Processing Payment..."
                            : "Confirm Payment"}
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
