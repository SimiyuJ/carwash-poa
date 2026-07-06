"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Plus,
  Search,
  TrendingDown,
  Receipt,
  Wallet,
  Calendar,
  Building2,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  BarChart3,
  TimerReset,
  Droplets,
  Zap,
  Wrench,
  FileText,
  Clock3,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* =========================================
   TYPES
========================================= */

type ExpenseStatus = "paid" | "pending" | "overdue";

type ExpenseCategory =
  | "Chemicals"
  | "Water"
  | "Electricity"
  | "Salaries"
  | "Maintenance"
  | "Marketing"
  | "Rent"
  | "Fuel"
  | "Supplies"
  | "Other";

type PaymentMethod =
  | "Cash"
  | "M-Pesa"
  | "Bank"
  | "Card";

type Expense = {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  vendor: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  recurring: boolean;
  createdAt: string;
  notes?: string;
};

type Vendor = {
  id: number;
  name: string;
  amount: number;
  category: string;
};

type RecurringBill = {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
};

/* =========================================
   STATIC DATA
========================================= */

const recurringBills: RecurringBill[] = [
  {
    id: 1,
    title: "Shop Rent",
    amount: 65000,
    dueDate: "5 May",
  },

  {
    id: 2,
    title: "Electricity Bill",
    amount: 28000,
    dueDate: "8 May",
  },

  {
    id: 3,
    title: "Internet Subscription",
    amount: 6000,
    dueDate: "12 May",
  },
];

const topVendors: Vendor[] = [
  {
    id: 1,
    name: "CleanChem Supplies",
    amount: 125000,
    category: "Chemicals",
  },

  {
    id: 2,
    name: "WashTech Garage",
    amount: 89000,
    category: "Maintenance",
  },

  {
    id: 3,
    name: "Nairobi Water",
    amount: 74000,
    category: "Utilities",
  },
];

/* =========================================
   CATEGORY ICONS
========================================= */

const categoryIcons: Record<
  ExpenseCategory,
  any
> = {
  Chemicals: Droplets,
  Water: Droplets,
  Electricity: Zap,
  Salaries: Wallet,
  Maintenance: Wrench,
  Marketing: TrendingDown,
  Rent: Building2,
  Fuel: CreditCard,
  Supplies: Receipt,
  Other: FileText,
};

/* =========================================
   PAGE
========================================= */

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<
    Expense[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [openModal, setOpenModal] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Chemicals" as ExpenseCategory,
    amount: "",
    vendor: "",
    paymentMethod: "Cash" as PaymentMethod,
    status: "paid" as ExpenseStatus,
    recurring: false,
    notes: "",
  });

  /* =========================================
     FETCH EXPENSES
  ========================================= */

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(
        "❌ Error fetching expenses:",
        error.message
      );

      setLoading(false);
      return;
    }

    const formattedExpenses: Expense[] =
      (data || []).map((expense: any) => ({
        id: expense.id,
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        vendor: expense.vendor,
        paymentMethod:
          expense.payment_method,
        status: expense.status,
        recurring: expense.recurring,
        notes: expense.notes,
        createdAt:
          expense.created_at?.split("T")[0] ||
          "N/A",
      }));

    setExpenses(formattedExpenses);
    setLoading(false);
  };

  /* =========================================
     FILTERED
  ========================================= */

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        expense.vendor
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        expense.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [expenses, search, activeFilter]);

  /* =========================================
     STATS
  ========================================= */

  const totalExpenses = expenses.reduce(
    (acc, expense) => acc + expense.amount,
    0
  );

  const paidExpenses = expenses
    .filter(
      (expense) => expense.status === "paid"
    )
    .reduce(
      (acc, expense) => acc + expense.amount,
      0
    );

  const pendingExpenses = expenses
    .filter(
      (expense) =>
        expense.status === "pending"
    )
    .reduce(
      (acc, expense) => acc + expense.amount,
      0
    );

  const overdueExpenses = expenses
    .filter(
      (expense) =>
        expense.status === "overdue"
    )
    .reduce(
      (acc, expense) => acc + expense.amount,
      0
    );

  /* =========================================
     CREATE EXPENSE
  ========================================= */

  const handleCreateExpense = async () => {
    if (
      !formData.title ||
      !formData.vendor ||
      !formData.amount
    ) {
      alert("Fill all required fields");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("expenses")
      .insert([
        {
          title: formData.title,
          category: formData.category,
          amount: Number(formData.amount),
          vendor: formData.vendor,
          payment_method:
            formData.paymentMethod,
          status: formData.status,
          recurring: formData.recurring,
          notes: formData.notes,
        },
      ]);

    if (error) {
      console.error(
        "❌ Create Expense Error:",
        error.message
      );

      alert(error.message);
      setSaving(false);
      return;
    }

    await fetchExpenses();

    resetForm();
    setSaving(false);
  };

  /* =========================================
     EDIT
  ========================================= */

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);

    setFormData({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      vendor: expense.vendor,
      paymentMethod:
        expense.paymentMethod,
      status: expense.status,
      recurring: expense.recurring,
      notes: expense.notes || "",
    });

    setOpenModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;

    setSaving(true);

    const { error } = await supabase
      .from("expenses")
      .update({
        title: formData.title,
        category: formData.category,
        amount: Number(formData.amount),
        vendor: formData.vendor,
        payment_method:
          formData.paymentMethod,
        status: formData.status,
        recurring: formData.recurring,
        notes: formData.notes,
      })
      .eq("id", editingExpense.id);

    if (error) {
      console.error(
        "❌ Update Error:",
        error.message
      );

      alert(error.message);
      setSaving(false);
      return;
    }

    await fetchExpenses();

    resetForm();
    setSaving(false);
  };

  /* =========================================
     DELETE
  ========================================= */

  const handleDelete = async (
    id: number
  ) => {
    const confirmDelete = confirm(
      "Delete this expense?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "❌ Delete Error:",
        error.message
      );

      return;
    }

    setExpenses((prev) =>
      prev.filter((expense) => expense.id !== id)
    );
  };

  /* =========================================
     RESET
  ========================================= */

  const resetForm = () => {
    setEditingExpense(null);

    setFormData({
      title: "",
      category: "Chemicals",
      amount: "",
      vendor: "",
      paymentMethod: "Cash",
      status: "paid",
      recurring: false,
      notes: "",
    });

    setOpenModal(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] p-6 space-y-8">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white">
            Expenses
          </h1>

          <p className="text-gray-400 mt-2 text-lg">
            Manage operational spending &
            financial tracking
          </p>
        </div>

        <Button
          onClick={() => setOpenModal(true)}
          className="
            gap-2 rounded-2xl
            bg-cyan-400 hover:bg-cyan-500
            text-white px-6 py-6 text-lg font-semibold
          "
        >
          <Plus className="h-5 w-5" />
          Add Expense
        </Button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Expenses"
          value={`KES ${totalExpenses.toLocaleString()}`}
          icon={Wallet}
          glow="cyan"
        />

        <StatCard
          title="Paid Expenses"
          value={`KES ${paidExpenses.toLocaleString()}`}
          icon={CheckCircle2}
          glow="emerald"
        />

        <StatCard
          title="Pending"
          value={`KES ${pendingExpenses.toLocaleString()}`}
          icon={Clock3}
          glow="amber"
        />

        <StatCard
          title="Overdue"
          value={`KES ${overdueExpenses.toLocaleString()}`}
          icon={AlertTriangle}
          glow="red"
        />
      </div>

      {/* SEARCH */}

      <Card className="border-white/5 bg-[#040B1A] rounded-3xl">
        <CardContent className="p-5 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search expense title or vendor..."
              className="pl-10 h-12 bg-[#0B1220] border-white/10 text-white rounded-2xl placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              "all",
              "paid",
              "pending",
              "overdue",
            ].map((filter) => (
              <Button
                key={filter}
                onClick={() =>
                  setActiveFilter(filter)
                }
                variant={
                  activeFilter === filter
                    ? "default"
                    : "outline"
                }
                className={`
                  rounded-2xl capitalize
                  ${
                    activeFilter === filter
                      ? "bg-cyan-400 text-white"
                      : "bg-white/5 border-white/10 text-white"
                  }
                `}
              >
                {filter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LOADING */}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* EXPENSES */}

          <div className="xl:col-span-2 space-y-6">
            {filteredExpenses.map((expense) => {
              const Icon =
                categoryIcons[
                  expense.category
                ];

              return (
                <div
                  key={expense.id}
                  className="
                    rounded-3xl border border-white/5
                    bg-[#040B1A] p-6
                  "
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-cyan-400" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-white">
                            {expense.title}
                          </h2>

                          {expense.recurring && (
                            <Badge className="bg-purple-500 text-white border-0">
                              Recurring
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-400 mt-2">
                          {expense.vendor}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-4">
                          <InfoBadge
                            icon={Calendar}
                            text={
                              expense.createdAt
                            }
                          />

                          <InfoBadge
                            icon={CreditCard}
                            text={
                              expense.paymentMethod
                            }
                          />

                          <InfoBadge
                            icon={Receipt}
                            text={
                              expense.category
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-4">
                      <Badge
                        className={`
                          border-0 capitalize px-4 py-1
                          ${
                            expense.status ===
                            "paid"
                              ? "bg-emerald-500 text-white"
                              : expense.status ===
                                "pending"
                              ? "bg-amber-500 text-black"
                              : "bg-red-500 text-white"
                          }
                        `}
                      >
                        {expense.status}
                      </Badge>

                      <div>
                        <p className="text-gray-500 text-sm">
                          Amount
                        </p>

                        <h2 className="text-3xl font-black text-white mt-1">
                          KES{" "}
                          {expense.amount.toLocaleString()}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            openEdit(expense)
                          }
                          size="icon"
                          className="rounded-2xl bg-white/5 hover:bg-cyan-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          onClick={() =>
                            handleDelete(
                              expense.id
                            )
                          }
                          size="icon"
                          className="rounded-2xl bg-red-500/10 hover:bg-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {expense.notes && (
                    <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                      <p className="text-sm text-gray-300">
                        {expense.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SIDEBAR */}

          <div className="space-y-6">
            <Card className="rounded-3xl border-white/5 bg-[#040B1A]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Recurring Bills
                    </h2>

                    <p className="text-gray-400 text-sm mt-1">
                      Upcoming payments
                    </p>
                  </div>

                  <TimerReset className="h-6 w-6 text-cyan-400" />
                </div>

                <div className="space-y-4">
                  {recurringBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {bill.title}
                          </p>

                          <p className="text-gray-400 text-sm mt-1">
                            Due {bill.dueDate}
                          </p>
                        </div>

                        <h3 className="text-lg font-black text-cyan-400">
                          KES{" "}
                          {bill.amount.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/5 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">
                      Estimated Profit
                    </p>

                    <h2 className="text-4xl font-black text-white mt-2">
                      KES 742K
                    </h2>

                    <p className="text-emerald-400 text-sm flex items-center gap-1 mt-3">
                      <ArrowUpRight className="h-4 w-4" />
                      +18% this month
                    </p>
                  </div>

                  <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <TrendingDown className="h-8 w-8 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL */}

      {openModal && (
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/70 backdrop-blur-md p-4
          "
          onClick={resetForm}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              w-full max-w-2xl rounded-3xl
              border border-white/10 bg-[#081120]
              p-8
            "
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">
                  {editingExpense
                    ? "Edit Expense"
                    : "Add Expense"}
                </h2>

                <p className="text-gray-400 mt-2">
                  Track operational spending
                </p>
              </div>

              <button
                onClick={resetForm}
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label="Expense Title"
                placeholder="Enter expense title"
                value={formData.title}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    title: value,
                  })
                }
              />

              <FormInput
                label="Amount"
                placeholder="Enter amount"
                type="number"
                value={formData.amount}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    amount: value,
                  })
                }
              />

              <FormInput
                label="Vendor"
                placeholder="Enter vendor name"
                value={formData.vendor}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    vendor: value,
                  })
                }
              />

              <FormSelect
                label="Category"
                value={formData.category}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    category:
                      value as ExpenseCategory,
                  })
                }
                options={[
                  "Chemicals",
                  "Water",
                  "Electricity",
                  "Salaries",
                  "Maintenance",
                  "Marketing",
                  "Rent",
                  "Fuel",
                  "Supplies",
                  "Other",
                ]}
              />

              <FormSelect
                label="Payment Method"
                value={formData.paymentMethod}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    paymentMethod:
                      value as PaymentMethod,
                  })
                }
                options={[
                  "Cash",
                  "M-Pesa",
                  "Bank",
                  "Card",
                ]}
              />

              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    status:
                      value as ExpenseStatus,
                  })
                }
                options={[
                  "paid",
                  "pending",
                  "overdue",
                ]}
              />

              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">
                  Notes
                </label>

                <textarea
                  placeholder="Write additional notes..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  rows={4}
                  className="
                    w-full rounded-2xl bg-[#0B1220]
                    border border-white/10
                    text-white p-4 outline-none
                    placeholder:text-gray-500
                  "
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurring:
                        e.target.checked,
                    })
                  }
                />

                <p className="text-white">
                  Recurring Expense
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <Button
                onClick={resetForm}
                variant="outline"
                className="rounded-2xl border-white/10 bg-white/5 text-white"
              >
                Cancel
              </Button>

              <Button
                disabled={saving}
                onClick={
                  editingExpense
                    ? handleSaveEdit
                    : handleCreateExpense
                }
                className="rounded-2xl bg-cyan-400 hover:bg-cyan-500 text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingExpense ? (
                  "Save Changes"
                ) : (
                  "Create Expense"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================
   COMPONENTS
========================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  glow,
}: any) {
  const glowStyles: any = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    emerald:
      "text-emerald-400 bg-emerald-500/10",
    purple:
      "text-purple-400 bg-purple-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    red: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-[#040B1A] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-black text-white mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`
            h-14 w-14 rounded-2xl
            flex items-center justify-center
            ${glowStyles[glow]}
          `}
        >
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

function InfoBadge({
  icon: Icon,
  text,
}: any) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-sm text-gray-300">
      <Icon className="h-4 w-4 text-cyan-400" />
      {text}
    </div>
  );
}

type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
};

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: FormInputProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">
        {label}
      </label>

      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="
          h-12 rounded-2xl bg-[#0B1220]
          border-white/10 text-white
          placeholder:text-gray-500
        "
      />
    </div>
  );
}

type FormSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

function FormSelect({
  label,
  value,
  onChange,
  options,
}: FormSelectProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="
          w-full h-12 rounded-2xl
          bg-[#0B1220]
          border border-white/10
          text-white px-4
          outline-none
        "
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}