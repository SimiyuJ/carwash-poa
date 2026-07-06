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

    const [userBranchId, setUserBranchId] =
        useState<string | null>(null);

    const [userCarwashId, setUserCarwashId] =
        useState<string | null>(null);

    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const [search, setSearch] = useState("");

    const [branchFilter, setBranchFilter] = useState("ALL");
    const [carwashFilter, setCarwashFilter] = useState("ALL");

    const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod | null>(null);

    const [processingId, setProcessingId] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const today = new Date().toISOString().split("T")[0];
    /* ================= FETCH ================= */

    const fetchInvoices = async (
        branchId?: string,
        carwashId?: string,
        date?: string
    ) => {
        if (!branchId || !carwashId) return;

        setLoading(true);

        try {
            const selected =
                date ||
                selectedDate ||
                new Date().toISOString().split("T")[0];

            const startDate = new Date(`${selected}T00:00:00`);
            const endDate = new Date(`${selected}T23:59:59`);

            const { data, error } = await supabase
                .from("invoices")
                .select(`
        *,
        branch:branches(
          id,
          name,
          location,
          phone
        )
      `)
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
                        fetchInvoices(
                            userBranchId,
                            userCarwashId
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    

    useEffect(() => {
        if (userBranchId && userCarwashId) {
            fetchInvoices(
                userBranchId,
                userCarwashId,
                selectedDate
            );
        }
    }, [
        selectedDate,
        userBranchId,
        userCarwashId,
    ]);

    const normalizePlate = (plate: string = "") =>
        plate
            .toUpperCase()
            .replace(/\s+/g, "")
            .replace(/-/g, "");


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
            .select(`
            branch_id,
            carwash_id
        `)
            .eq("id", user.id)
            .single();

        if (!data) {
            setLoading(false);
            return;
        }

        setUserBranchId(data.branch_id);
        setUserCarwashId(data.carwash_id);

        await fetchInvoices(
            data.branch_id,
            data.carwash_id
        );
    };

    /* ================= FILTERS ================= */

    const branchOptions = useMemo(() => {
        return [
            "ALL",
            ...new Set(
                invoices
                    .map((i) => i.branch_id)
                    .filter(Boolean)
                    .map(String)
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
                    .map(String)
            ),
        ];
    }, [invoices]);

    <div className="flex gap-2 items-center">

        <input
            type="date"
            value={selectedDate}
            onChange={(e) =>
                setSelectedDate(e.target.value)
            }
            className="
      bg-slate-950
      border
      border-slate-700
      rounded-2xl
      px-4
      h-12
    "
        />

        <button
            onClick={() =>
                setSelectedDate(
                    new Date()
                        .toISOString()
                        .split("T")[0]
                )
            }
            className="
      px-4
      h-12
      rounded-2xl
      bg-cyan-500
      text-black
      font-semibold
    "
        >
            Today
        </button>

    </div>

    const filteredInvoices = useMemo(() => {
        const q = search.toLowerCase().trim();

        return invoices.filter((invoice) => {
            const searchMatch =
                invoice.invoice_number?.toLowerCase().includes(q) ||
                invoice.customer?.toLowerCase().includes(q) ||
                normalizePlate(invoice.plate).includes(
                    normalizePlate(q)
                )

            const branchMatch =
                branchFilter === "ALL" ||
                invoice.branch_id === branchFilter;

            const carwashMatch =
                carwashFilter === "ALL" ||
                invoice.carwash_id === carwashFilter;

            return searchMatch && branchMatch && carwashMatch;
        });
    }, [search, invoices, branchFilter, carwashFilter]);

    /* ================= STATS ================= */

    const stats = useMemo(() => {
        const totalInvoices = filteredInvoices.length;

        const paidInvoices = filteredInvoices.filter(
            (i) => i.payment_status === "PAID"
        ).length;

        const pendingInvoices = filteredInvoices.filter(
            (i) => i.payment_status !== "PAID"
        ).length;

        const revenue = filteredInvoices.reduce(
            (sum, i) => sum + Number(i.total || 0),
            0
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
                userCarwashId || undefined
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
<span>${new Date(
            invoice.created_at
        ).toLocaleString()}</span>
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

${invoice.services
                ?.map(
                    (s) => `
<div class="row">
<span>${s.name}</span>
<span>KSh ${s.price}</span>
</div>
`
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
    />

    /* ================= UI ================= */

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">

            {/* HEADER */}

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-cyan-500">
                    <Receipt className="h-7 w-7" />
                </div>

                <div>
                    <h1 className="text-4xl font-black">
                        Invoice Management
                    </h1>

                    <p className="text-slate-400">
                        Multi Branch • Multi Carwash
                    </p>
                </div>
            </div>

            <p className="text-slate-400">
                Showing invoices for:

                <span className="text-cyan-400 ml-2">
                    {new Date(selectedDate).toLocaleDateString()}
                </span>
            </p>

            {/* STATS */}

            <div className="grid gap-4 md:grid-cols-4 mb-6">

                <StatCard
                    title="Invoices"
                    value={stats.totalInvoices}
                />

                <StatCard
                    title="Paid"
                    value={stats.paidInvoices}
                />

                <StatCard
                    title="Pending"
                    value={stats.pendingInvoices}
                />

                <StatCard
                    title="Revenue"
                    value={`KSh ${stats.revenue.toLocaleString()}`}
                />

            </div>

            {/* FILTERS */}

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-6">

                <div className="grid lg:grid-cols-3 gap-4">

                    <div className="flex items-center gap-2 bg-slate-950 rounded-2xl px-4">
                        <Search className="h-4 w-4 text-slate-500" />

                        <input
                            className="bg-transparent h-12 w-full outline-none"
                            placeholder="Search invoice, customer, plate..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-400">
                            Invoice Date
                        </label>

                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) =>
                                setSelectedDate(e.target.value)
                            }
                            className="w-[180px]"
                        />

                        <Button
                            variant="outline"
                            onClick={() =>
                                setSelectedDate(today)
                            }
                        >
                            Today
                        </Button>
                    </div>

                </div>
            </div>

            {/* LOADING */}

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10" />
                </div>
            )}

            {/* EMPTY */}

            {!loading && filteredInvoices.length === 0 && (
                <div className="text-center py-24">
                    <FileText className="mx-auto h-16 w-16 text-slate-700" />

                    <h2 className="mt-4 text-xl font-bold">
                        No invoices found
                    </h2>
                </div>
            )}

            {/* INVOICES */}

            <div className="grid gap-5 xl:grid-cols-3 lg:grid-cols-2">

                {filteredInvoices.map((invoice) => (

                    <div
                        key={invoice.id}
                        className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
                    >
                        <div className="flex justify-between">

                            <div>
                                <h2 className="font-black text-cyan-400 text-xl">
                                    {invoice.invoice_number}
                                </h2>

                                <p className="text-xs text-slate-400">
                                    {new Date(
                                        invoice.created_at
                                    ).toLocaleString()}
                                </p>
                            </div>

                            <div
                                className={`px-3 py-1 rounded-full text-xs ${invoice.payment_status === "PAID"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                    }`}
                            >
                                {invoice.payment_status}
                            </div>
                        </div>

                        <div className="space-y-3 mt-5">

                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {invoice.customer}
                            </div>

                            <div className="flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                {invoice.plate}
                            </div>

                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {invoice.branch_id || "No Branch"}
                            </div>

                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                {invoice.carwash_id || "No Carwash"}
                            </div>

                        </div>

                        <div className="mt-5 bg-slate-950 rounded-2xl p-4">

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

                            <div className="border-t border-slate-700 mt-3 pt-3 flex justify-between">
                                <span>Total</span>

                                <span className="font-black text-cyan-400">
                                    KSh {invoice.total}
                                </span>
                            </div>

                        </div>

                        {invoice.cashier && (
                            <p className="mt-3 text-sm text-slate-400">
                                Cashier: {invoice.cashier}
                            </p>
                        )}

                        {invoice.notes && (
                            <div className="mt-3 bg-slate-950 p-3 rounded-xl text-sm">
                                {invoice.notes}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-5">

                            <button
                                onClick={() =>
                                    printReceipt(invoice)
                                }
                                className="bg-slate-800 rounded-2xl py-3 flex justify-center items-center gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </button>

                            {invoice.payment_status !== "PAID" && (
                                <button
                                    onClick={() =>
                                        setPayingInvoice(invoice)
                                    }
                                    className="bg-green-600 rounded-2xl py-3 flex justify-center items-center gap-2"
                                >
                                    <Wallet className="h-4 w-4" />
                                    Pay
                                </button>
                            )}

                            {invoice.payment_status === "PAID" && (
                                <button className="bg-green-500/20 text-green-400 rounded-2xl py-3 flex justify-center items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Paid
                                </button>
                            )}

                        </div>

                    </div>
                ))}
            </div>

            {/* PAYMENT MODAL */}

            {payingInvoice && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

                    <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6">

                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-xl">
                                Payment Method
                            </h2>

                            <button
                                onClick={() =>
                                    setPayingInvoice(null)
                                }
                            >
                                <X />
                            </button>
                        </div>

                        <div className="space-y-3 mt-6">

                            {[
                                {
                                    id: "CASH",
                                    icon: Banknote,
                                    label: "Cash",
                                },
                                {
                                    id: "CARD",
                                    icon: CreditCard,
                                    label: "Card",
                                },
                                {
                                    id: "MPESA",
                                    icon: Smartphone,
                                    label: "M-Pesa",
                                },
                                {
                                    id: "OTHER",
                                    icon: Wallet,
                                    label: "Other",
                                },
                            ].map((m) => {
                                const Icon = m.icon;

                                return (
                                    <button
                                        key={m.id}
                                        onClick={() =>
                                            setPaymentMethod(
                                                m.id as PaymentMethod
                                            )
                                        }
                                        className={`w-full border rounded-2xl p-4 flex items-center gap-3 ${paymentMethod === m.id
                                            ? "border-cyan-500"
                                            : "border-slate-700"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={confirmPayment}
                            disabled={
                                !paymentMethod ||
                                processingId === payingInvoice.id
                            }
                            className="mt-6 w-full bg-cyan-500 rounded-2xl py-3 font-bold"
                        >
                            {processingId === payingInvoice.id
                                ? "Processing..."
                                : "Confirm Payment"}
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}

/* ================= COMPONENT ================= */

function StatCard({
    title,
    value,
}: {
    title: string;
    value: string | number;
}) {
    return (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">
                {title}
            </p>

            <h3 className="text-3xl font-black mt-2">
                {value}
            </h3>
        </div>
    );
}