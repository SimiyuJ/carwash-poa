"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Receipt,
  Search,
  Printer,
  Calendar,
  User,
  Car,
  CreditCard,
  CheckCircle2,
  Clock3,
  AlertTriangle,
} from "lucide-react";

type ReceiptRecord = {
  id: string;
  invoice_number: string;
  customer: string;
  plate: string;
  total: number;
  payment_status: string;
  payment_method?: string;
  created_at: string;
  branch_name?: string;
  branch_location?: string;
  branch_phone?: string;

  services?: {
    name: string;
    price: number;
    qty?: number;
  }[];

  branch_id?: string;
  carwash_id?: string;
};

/* =========================================
   PAGE
========================================= */

export default function ReceiptsPage() {
  const [receipts, setReceipts] =
    useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedReceipt, setSelectedReceipt] =
    useState<ReceiptRecord | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const [userBranchId, setUserBranchId] =
    useState<string | null>(null);

  const [userCarwashId, setUserCarwashId] =
    useState<string | null>(null);

  /* =========================================
     LOAD RECEIPTS
  ========================================= */

  const loadReceipts = async (
    branchId?: string,
    carwashId?: string
  ) => {
    if (!branchId || !carwashId) return;

    try {
      setLoading(true);

      const { data, error } =
        await supabase
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
          .eq("carwash_id", carwashId)
          .eq("branch_id", branchId)
          .order("created_at", {
            ascending: false,
          });

      console.log("QUERY ERROR:", error);
      console.log("QUERY DATA:", data);


      if (error) {
        console.log(error);
        return;
      }

      setReceipts(data || []);
      console.log("BRANCH:", branchId);
      console.log("CARWASH:", carwashId);
      console.log("RECEIPTS:", data);
      console.log("COUNT:", data?.length);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
       LOAD USER SCOPE
    ========================================= */
  const loadUserScope = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        branch_id,
        carwash_id,
        role
        `)
      .eq("id", user.id)
      .single();

    if (!data) {
      console.log("NO PROFILE FOUND");
      return;
    }

    console.log("PROFILE:", data);

    setUserBranchId(data.branch_id);
    setUserCarwashId(data.carwash_id);
  };

  useEffect(() => {
    loadUserScope();
  }, []);
  useEffect(() => {
    if (!userBranchId || !userCarwashId) return;

    loadReceipts(
      userBranchId,
      userCarwashId
    );

    const channel = supabase
      .channel("receipts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
        },
        (payload) => {

          const invoice =
            payload.new as ReceiptRecord;

          if (
            invoice?.carwash_id !==
            userCarwashId
          ) {
            return;
          }

          if (
            invoice?.branch_id !==
            userBranchId
          ) {
            return;
          }

          loadReceipts(
            userBranchId,
            userCarwashId
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    userBranchId,
    userCarwashId,
  ]);

  /* =========================================
     FILTERED
  ========================================= */

  const filteredReceipts = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return receipts;

    return receipts.filter((receipt) => {
      const invoice =
        receipt.invoice_number?.toLowerCase() || "";

      const customer =
        receipt.customer?.toLowerCase() || "";

      const plate =
        receipt.plate
          ?.replace(/\s+/g, "")
          .toLowerCase() || "";

      return (
        invoice.includes(q) ||
        customer.includes(q) ||
        plate.includes(
          q.replace(/\s+/g, "")
        )
      );
    });
  }, [receipts, search]);

  /* =========================================
     PRINT RECEIPT
  ========================================= */

  const printReceipt = (
    receipt: ReceiptRecord
  ) => {
    setSelectedReceipt(receipt);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  /* =========================================
     TOTAL
  ========================================= */

  const totalRevenue = filteredReceipts.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#020817] p-6 text-white">

      {/* =========================================
         HEADER
      ========================================= */}

      <div className="mb-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#061226] via-[#071b34] to-[#0b1120] p-8 shadow-2xl">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-5">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
              <Receipt className="h-8 w-8 text-cyan-400" />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Receipt Center
              </p>

              <h1 className="text-4xl font-black tracking-tight text-white">
                Saved Receipts
              </h1>

              <p className="mt-2 text-slate-400">
                View and print previous POS receipts
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5">

            <div className="text-sm text-slate-400">
              Total Revenue
            </div>

            <div className="mt-2 text-3xl font-black text-green-400">
              KSh {totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
         SEARCH
      ========================================= */}

      <div className="mb-6 rounded-3xl border border-white/10 bg-[#0B1220] p-5">

        <div className="relative">

          <Search className="absolute left-4 top-4 h-5 w-5 text-slate-500" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search invoice, customer or plate..."
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#111827] pl-12 pr-4 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500"
          />
        </div>
      </div>

      {/* =========================================
         TABLE
      ========================================= */}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B1220]">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="border-b border-white/10 bg-white/5">

              <tr className="text-left text-sm text-slate-400">

                <th className="px-6 py-4">
                  Invoice
                </th>

                <th className="px-6 py-4">
                  Customer
                </th>

                <th className="px-6 py-4">
                  Plate
                </th>

                <th className="px-6 py-4">
                  Amount
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Date
                </th>

                <th className="px-6 py-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Loading receipts...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    No receipts found
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="border-b border-white/5 transition hover:bg-white/[0.03]"
                  >

                    <td className="px-6 py-5">

                      <div className="font-semibold text-white">
                        {receipt.invoice_number}
                      </div>
                    </td>

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-2">

                        <User className="h-4 w-4 text-cyan-400" />

                        <span>
                          {receipt.customer}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-2">

                        <Car className="h-4 w-4 text-yellow-400" />

                        <span>
                          {receipt.plate}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      {receipt.branch_name || "-"}
                    </td>

                    <td className="px-6 py-5 font-bold text-green-400">
                      KSh{" "}
                      {Number(
                        receipt.total || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-6 py-5">

                      {receipt.payment_status ===
                        "PAID" ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          PAID
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          PENDING
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-400">

                      <div className="flex items-center gap-2">

                        <Calendar className="h-4 w-4" />

                        {new Date(
                          receipt.created_at
                        ).toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-5">

                      <button
                        onClick={() =>
                          printReceipt(receipt)
                        }
                        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
                      >
                        <Printer className="h-4 w-4" />
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
         PRINT RECEIPT
      ========================================= */}

      {selectedReceipt && (
        <div
          id="print-receipt"
          className="hidden print:block"
        >
          <div
            ref={printRef}
            className="receipt-container"
          >

            <h1>
              <h1>
                {selectedReceipt.branch_name ||
                  "CAR WASH"}
              </h1>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                }}
              >
                {selectedReceipt.branch_location}
              </p>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                }}
              >
                {selectedReceipt.branch_phone}
              </p>

              <hr />
            </h1>

            <div className="receipt-info">

              <p>
                <strong>Invoice:</strong>{" "}
                {selectedReceipt.invoice_number}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(
                  selectedReceipt.created_at
                ).toLocaleString()}
              </p>

              <p>
                <strong>Plate:</strong>{" "}
                {selectedReceipt.plate}
              </p>

              <p>
                <strong>Customer:</strong>{" "}
                {selectedReceipt.customer}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {selectedReceipt.payment_status}
              </p>

              <p>
                <strong>Payment:</strong>{" "}
                {selectedReceipt.payment_method ||
                  "-"}
              </p>
            </div>

            <div className="receipt-divider">

              {(selectedReceipt.services || []).map(
                (item: any, i: number) => (
                  <div
                    key={i}
                    className="receipt-item"
                  >
                    <span>
                      {item.name}
                    </span>

                    <span>
                      KSh {item.price}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="receipt-total">

              <span>TOTAL</span>

              <span>
                KSh{" "}
                {Number(
                  selectedReceipt.total || 0
                ).toLocaleString()}
              </span>
            </div>

            <div
              className={`receipt-status ${selectedReceipt.payment_status ===
                "PAID"
                ? "paid"
                : "pending"
                }`}
            >
              {selectedReceipt.payment_status}
            </div>

            <div className="receipt-footer">

              <p>
                Thank you for choosing us
              </p>

              <p>
                Safe drive and see you again!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
         RECEIPT CSS
      ========================================= */}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #print-receipt,
          #print-receipt * {
            visibility: visible;
          }

          #print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }

          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            background: white !important;
          }
        }

        .receipt-container {
          width: 300px;
          margin: auto;
          background: white;
          color: black;
          padding: 16px;
          font-family: monospace;
        }

        .receipt-container h1 {
          text-align: center;
          font-size: 22px;
          margin-bottom: 16px;
          font-weight: bold;
        }

        .receipt-info p {
          margin: 4px 0;
          font-size: 13px;
        }

        .receipt-divider {
          border-top: 1px dashed black;
          border-bottom: 1px dashed black;
          margin: 14px 0;
          padding: 10px 0;
        }

        .receipt-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .receipt-total {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: bold;
          margin-top: 10px;
        }

        .receipt-status {
          text-align: center;
          margin-top: 14px;
          padding: 8px;
          font-weight: bold;
          border: 1px dashed black;
        }

        .receipt-status.paid {
          background: #dcfce7;
        }

        .receipt-status.pending {
          background: #fef3c7;
        }

        .receipt-footer {
          text-align: center;
          margin-top: 18px;
          font-size: 12px;
        }

        .receipt-footer p {
          margin: 3px 0;
        }
      `}</style>
    </div>
  );
}