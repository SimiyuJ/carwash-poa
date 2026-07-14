"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Gem, CheckCircle2, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";
type Plan = {
  id: number;
  name: string;
  price: number;
  description?: string;
  features: string[];
  wash_limit: number;
  amount_saved?: number;
  glow?: string;
};

export default function CustomerSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [member, setMember] = useState<any[]>([]);
  const { activeBranch, activeBranchId, isReady } = useActiveBranch();
  const activeCarwashId = activeBranch?.carwashId;
  const [activeTab, setActiveTab] = useState<
    "membership" | "plans" | "history"
  >("membership");
  /* =========================================================
     FETCH PLANS
  ========================================================= */
  console.log({
    activeBranch,
    activeBranchId,
    activeCarwashId,
  });

  useEffect(() => {
    if (!isReady) return;

    if (!activeCarwashId || !activeBranchId) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Get logged in user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Get customer record
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("id, carwash_id, branch_id")
          .eq("profile_id", user.id)
          .eq("carwash_id", activeCarwashId)
          .eq("branch_id", activeBranchId)
          .maybeSingle();

        if (!customer) {
          setLoading(false);
          return;
        }
        const { carwash_id, branch_id } = customer;

        // Get active subscription
        // Get active subscription
        const { data: members, error: memberError } = await supabase
          .from("subscription_members")
          .select("*")
          .eq("customer_id", customer.id)
          .eq("carwash_id", activeCarwashId)
          .eq("branch_id", activeBranchId);

        if (memberError) {
          console.error(memberError);
        } else {
          setMember(members || []);
        }

        // Get plans
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("carwash_id", activeCarwashId)
          .eq("branch_id", activeBranchId)
          .order("id", { ascending: false });

        if (error) {
          console.error(error);
          return;
        }

        setPlans(
          (data || []).map((p: any) => ({
            id: p.id,

            name: p.name,

            price: Number(p.price || 0),

            description: "",

            features: Array.isArray(p.description) ? p.description : [],

            amount_saved: Number(p.amount_saved || 0),

            wash_limit: Number(p.wash_limit || 0),

            glow: p.glow || "from-cyan-500 to-blue-600",
          })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchInvoices();
  }, [isReady, activeCarwashId, activeBranchId]);

  //subscribe
  const handleSubscribe = async (plan: Plan) => {
    try {
      setSubscribing(true);

      // Get user once
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get customer context
      const { data: customer } = await supabase
        .from("customers")
        .select("id, carwash_id, branch_id")
        .eq("profile_id", user.id)
        .eq("carwash_id", activeCarwashId)
        .eq("branch_id", activeBranchId)
        .maybeSingle();

      if (!customer) return;

      const customerId = customer.id;
      const carwashId = customer.carwash_id;
      const branchId = customer.branch_id;

      const { carwash_id, branch_id } = customer;

      // Check existing subscription
      const { data: existing } = await supabase
        .from("subscription_members")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("carwash_id", carwash_id)
        .eq("branch_id", branch_id)
        .maybeSingle();

      const now = new Date();
      const expires = new Date();
      expires.setMonth(now.getMonth() + 1);

      if (existing) {
        await supabase
          .from("subscription_members")
          .update({
            plan_id: plan.id,
            status: "active",
            started_at: now.toISOString(),
            expires_at: expires.toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("subscription_members").insert({
          customer_id: customer.id,
          plan_id: plan.id,
          carwash_id,
          branch_id,
          status: "active",
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
        });
      }

      // refresh UI
      window.location.reload(); // simple + safe for now
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(false);
    }
  };

  //fetch invoices
  const fetchInvoices = async () => {
    if (!isReady) return;

    if (!activeCarwashId || !activeBranchId) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id, carwash_id, branch_id")
        .eq("profile_id", user.id)
        .eq("carwash_id", activeCarwashId)
        .eq("branch_id", activeBranchId)
        .maybeSingle();

      if (customerError || !customer) {
        alert(JSON.stringify(customerError));
        console.log("Current user:", user.id);
        console.log("Customer:", customer);
        console.log("Customer Error:", customerError);
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("carwash_id", activeCarwashId)
        .eq("branch_id", activeBranchId)
        .order("created_at", { ascending: false })
        .limit(7);

      if (error) {
        console.error(error);
        return;
      }

      setInvoices(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================================
     FILTERED PLANS
  ========================================================= */
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) =>
      plan.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, plans]);

  return (
    <div
      className="
    min-h-screen
    bg-gradient-to-br
    from-[#07142B]
    via-[#081A33]
    to-[#07142B]
    text-white
    px-3
    py-4
    sm:px-4
    sm:py-5
    lg:px-6
    lg:py-6
  "
    >
      <div
        className="
        mx-auto
        w-full
        max-w-7xl
        space-y-4
        lg:space-y-5
        "
      >
        {/* =========================================================
     PREMIUM HERO
========================================================= */}

        <div
          className="
    relative
    overflow-hidden
    rounded-[30px]
    border border-cyan-500/10
    bg-gradient-to-br
    from-[#07142B]
    via-[#0A1D3D]
    to-[#07142B]
  "
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_42%)]" />

          {/* Top Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          <div className="relative p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}

              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className="
            flex
            h-12
            w-12
            sm:h-14
            sm:w-14
            items-center
            justify-center
            rounded-2xl
            border border-cyan-500/20
            bg-cyan-500/10
            shrink-0
          "
                >
                  <Gem className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[4px] font-semibold text-cyan-400">
                    Premium Membership
                  </p>

                  <h1
                    className="
              mt-1
              text-2xl
              sm:text-3xl
              lg:text-4xl
              xl:text-5xl
              font-extrabold
              tracking-tight
              leading-tight
              text-slate-100
            "
                  >
                    Subscription Plans
                  </h1>

                  <p
                    className="
              mt-2
              max-w-xl
              text-sm
              sm:text-base
              leading-relaxed
              text-slate-300
            "
                  >
                    Discover premium membership plans with exclusive savings,
                    priority service and unlimited vehicle care benefits.
                  </p>
                </div>
              </div>

              {/* RIGHT */}

              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto shrink-0">
                {/* Plans */}

                <div
                  className="
            rounded-2xl
            border border-white/10
            bg-white/5
            backdrop-blur-sm
            px-4
            py-4
            min-w-[135px]
          "
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Plans
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-cyan-400">
                    {plans.length}
                  </h2>
                </div>

                {/* Status */}

                <div
                  className="
            rounded-2xl
            border border-white/10
            bg-white/5
            backdrop-blur-sm
            px-4
            py-4
            min-w-[150px]
          "
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Membership
                  </p>

                  {member.length > 0 ? (
                    <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                      <span className="text-sm font-semibold text-emerald-300">
                        Active
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                      <span className="text-sm font-semibold text-amber-300">
                        No Active Plan
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
     PREMIUM SEARCH
========================================================= */}

        <div
          className="
    relative
    overflow-hidden
    rounded-[26px]
    border border-cyan-500/10
    bg-gradient-to-br
    from-[#07142B]
    via-[#0A1D3D]
    to-[#07142B]
  "
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(34,211,238,.08),transparent_45%)]" />

          <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}

            <div
              className="
        flex
        flex-1
        items-center
        gap-3

        rounded-2xl
        border border-cyan-500/10

        bg-white/5

        px-4
        py-3

        backdrop-blur-sm

        transition-all
        duration-300

        focus-within:border-cyan-400/40
        focus-within:bg-white/10
      "
            >
              <Search className="h-5 w-5 shrink-0 text-cyan-400" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subscription plans..."
                className="
          h-auto
          border-0
          bg-transparent
          p-0

          text-slate-100
          placeholder:text-slate-500

          focus-visible:ring-0
          focus-visible:ring-offset-0
        "
              />
            </div>

            {/* Result Counter */}

            <div
              className="
        flex
        items-center
        justify-center

        rounded-2xl

        border border-white/10
        bg-white/5

        px-5
        py-3

        backdrop-blur-sm

        sm:min-w-[150px]
      "
            >
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[3px] text-slate-500">
                  Results
                </p>

                <h3 className="mt-1 text-xl font-semibold text-cyan-400">
                  {filteredPlans.length}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
    SECTION NAVIGATION
========================================================= */}

        <div className="sticky top-2 z-30">
          <div
            className="
      flex
      gap-2
      overflow-x-auto
      rounded-2xl
      border
      border-cyan-500/10
      bg-[#07142B]/95
      backdrop-blur-xl
      p-2
      scrollbar-hide
    "
          >
            <Button
              type="button"
              onClick={() => setActiveTab("membership")}
              className={
                activeTab === "membership"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl"
                  : "bg-white/5 text-slate-300 rounded-xl hover:bg-white/10"
              }
            >
              Membership
            </Button>

            <Button
              type="button"
              onClick={() => setActiveTab("plans")}
              className={
                activeTab === "plans"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl"
                  : "bg-white/5 text-slate-300 rounded-xl hover:bg-white/10"
              }
            >
              Plans
            </Button>

            <Button
              type="button"
              onClick={() => setActiveTab("history")}
              className={
                activeTab === "history"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl"
                  : "bg-white/5 text-slate-300 rounded-xl hover:bg-white/10"
              }
            >
              Payments
            </Button>
          </div>
        </div>

        {/* =========================================================
     LOADING STATE
========================================================= */}

        {loading && (
          <Card
            className="
      relative
      overflow-hidden
      rounded-[30px]
      border border-cyan-500/10
      bg-gradient-to-br
      from-[#07142B]
      via-[#0A1D3D]
      to-[#07142B]
    "
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_45%)]" />

            {/* Top Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

            <CardContent className="relative flex flex-col items-center justify-center py-16 sm:py-20">
              {/* Spinner */}

              <div
                className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-3xl
          border
          border-cyan-500/20
          bg-cyan-500/10
          shadow-lg
          shadow-cyan-500/10
        "
              >
                <Sparkles className="h-8 w-8 animate-pulse text-cyan-400" />
              </div>

              {/* Title */}

              <h2 className="mt-6 text-2xl font-bold text-slate-100">
                Loading Plans
              </h2>

              {/* Description */}

              <p className="mt-2 max-w-md text-center text-sm sm:text-base text-slate-300 leading-relaxed">
                We're preparing the latest subscription plans and membership
                information for you.
              </p>

              {/* Animated Loader */}

              <div className="mt-8 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" />

                <div
                  className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />

                <div
                  className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACTIVE MEMBERSHIP */}

        {activeTab === "membership" && (
          <div>
            {member?.map((sub) => (
              <Card
                key={sub.id}
                className="
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-cyan-500/10
        bg-gradient-to-br
        from-[#07142B]
        via-[#0A1D3D]
        to-[#07142B]
      "
              >
                {/* glow */}

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_45%)]" />

                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                <CardContent className="relative p-4 sm:p-6">
                  {/* HEADER */}

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-4">
                      <div
                        className="
                h-14
                w-14
                rounded-2xl
                bg-cyan-500/10
                border
                border-cyan-500/20
                flex
                items-center
                justify-center
              "
                      >
                        <Gem className="h-7 w-7 text-cyan-400" />
                      </div>

                      <div>
                        <div
                          className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  px-3
                  py-1
                  text-[11px]
                  uppercase
                  tracking-[0.2em]
                  text-cyan-300
                "
                        >
                          <Sparkles className="h-3 w-3" />
                          Active Membership
                        </div>

                        <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-100">
                          {sub.plan}
                        </h2>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">
                            {sub.plate}
                          </span>

                          <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
                            {sub.vehicle}
                          </span>

                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Renewal
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-slate-100">
                        {new Date(sub.renewal).toLocaleDateString()}
                      </h3>
                    </div>
                  </div>

                  {/* STATS */}

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] uppercase text-slate-400">
                        Total
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-cyan-400">
                        {sub.limit}
                      </h3>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] uppercase text-slate-400">
                        Used
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-amber-300">
                        {sub.usage}
                      </h3>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-[10px] uppercase text-emerald-300">
                        Remaining
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-emerald-400">
                        {sub.limit - sub.usage}
                      </h3>
                    </div>
                  </div>

                  {/* PROGRESS */}

                  <div className="mt-7">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-300">Wash Usage</span>

                      <span className="font-semibold text-cyan-300">
                        {Math.round((sub.usage / sub.limit) * 100)}%
                      </span>
                    </div>

                    <Progress
                      value={(sub.usage / sub.limit) * 100}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* =========================================================
     PLANS GRID
========================================================= */}
        {activeTab === "plans" && (
          <section className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400 font-semibold">
                  Membership Plans
                </p>

                <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100">
                  Choose Your Plan
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Flexible monthly memberships with premium savings and
                  unlimited convenience.
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-2">
                <Gem className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-slate-300">
                  {filteredPlans.length} Available Plans
                </span>
              </div>
            </div>

            <div
              className="
      grid
      grid-cols-1
      sm:grid-cols-2
      xl:grid-cols-3
      gap-4
      lg:gap-6
    "
            >
              {filteredPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="
          group
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-cyan-500/10
          bg-gradient-to-br
          from-[#07142B]
          via-[#0A1D3D]
          to-[#07142B]
          transition-all
          duration-300
          hover:-translate-y-1
          hover:border-cyan-400/30
          hover:shadow-[0_18px_45px_rgba(34,211,238,.14)]
        "
                >
                  {/* Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Top Highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                  <CardContent className="relative flex h-full flex-col p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div
                        className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/10
              "
                      >
                        <Gem className="h-6 w-6 text-cyan-400" />
                      </div>

                      <span
                        className="
                rounded-full
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-3
                py-1
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-cyan-300
              "
                      >
                        Monthly
                      </span>
                    </div>

                    {/* Plan */}
                    <div className="mt-5">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                        {plan.name}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        {plan.description ||
                          "Premium monthly membership for regular vehicle care."}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mt-6">
                      <div className="flex items-end gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400">
                          KES {plan.price.toLocaleString()}
                        </span>

                        <span className="pb-1 text-sm text-slate-500">
                          /month
                        </span>
                      </div>

                      <div
                        className="
                mt-4
                inline-flex
                items-center
                rounded-full
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-3
                py-1
                text-xs
                font-medium
                text-cyan-300
              "
                      >
                        {plan.wash_limit} Washes Included
                      </div>
                    </div>

                    {/* Savings */}
                    {Number(plan.amount_saved) > 0 && (
                      <div
                        className="
                mt-5
                rounded-2xl
                border
                border-emerald-500/20
                bg-emerald-500/5
                p-4
              "
                      >
                        <p className="text-xs uppercase tracking-wide text-emerald-300">
                          Monthly Savings
                        </p>

                        <h4 className="mt-2 text-2xl font-bold text-emerald-400">
                          KES {Number(plan.amount_saved).toLocaleString()}
                        </h4>
                      </div>
                    )}

                    {/* Features */}
                    <div className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                          <span className="text-sm text-slate-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button
                      disabled={subscribing}
                      onClick={() => handleSubscribe(plan)}
                      className="
              mt-7
              h-12
              w-full
              rounded-2xl
              bg-gradient-to-r
              from-cyan-500
              via-sky-500
              to-blue-600
              text-white
              font-semibold
              transition-all
              hover:scale-[1.02]
              hover:shadow-lg
              hover:shadow-cyan-500/30
            "
                    >
                      {subscribing ? (
                        "Processing..."
                      ) : (
                        <>
                          <Gem className="mr-2 h-4 w-4" />
                          Subscribe Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================
     PAYMENT HISTORY
========================================================= */}
        {activeTab === "history" && (
          <section className="space-y-5">
            {/* SECTION HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-cyan-400">
                  Payments
                </p>

                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-100">
                  Payment History
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  View your recent invoices, receipts and completed subscription
                  payments.
                </p>
              </div>

              <div
                className="
        hidden
        lg:flex
        items-center
        gap-2
        rounded-2xl
        border
        border-cyan-500/10
        bg-cyan-500/5
        px-4
        py-3
      "
              >
                <CheckCircle2 className="h-5 w-5 text-cyan-400" />

                <div>
                  <p className="text-xs uppercase text-slate-500">
                    Total Records
                  </p>

                  <p className="font-semibold text-slate-200">
                    {invoices.length}
                  </p>
                </div>
              </div>
            </div>

            {/* HISTORY LIST */}
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="
          group
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-cyan-500/10
          bg-gradient-to-br
          from-[#07142B]
          via-[#0A1D3D]
          to-[#07142B]
          transition-all
          duration-300
          hover:border-cyan-400/30
          hover:shadow-[0_15px_40px_rgba(34,211,238,.12)]
        "
                >
                  {/* Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_45%)] opacity-0 group-hover:opacity-100 transition" />

                  {/* Highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                  <CardContent className="relative p-5 sm:p-6">
                    {/* TOP */}
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                          Receipt
                        </div>

                        <h3 className="mt-3 text-lg sm:text-2xl font-bold text-slate-100">
                          {invoice.receipt_number}
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Amount Paid
                        </p>

                        <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-emerald-400">
                          KES {Number(invoice.amount_paid).toLocaleString()}
                        </h2>
                      </div>
                    </div>

                    {/* SERVICES */}

                    {Array.isArray(invoice.services) &&
                      invoice.services.length > 0 && (
                        <div className="mt-7">
                          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                            Services Included
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {invoice.services.map(
                              (service: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-white/10
                        bg-white/5
                        px-3
                        py-2
                      "
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                                  <span className="text-sm text-slate-300">
                                    {service.name}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* FOOTER */}

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <span
                        className="
                rounded-full
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-4
                py-2
                text-xs
                font-medium
                text-cyan-300
              "
                      >
                        {invoice.payment_method}
                      </span>

                      <span
                        className="
                rounded-full
                border
                border-emerald-500/20
                bg-emerald-500/10
                px-4
                py-2
                text-xs
                font-medium
                text-emerald-300
              "
                      >
                        {invoice.payment_status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* EMPTY PLANS */}
        {activeTab === "plans" && !loading && filteredPlans.length === 0 && (
          <Card
            id="plans"
            className="
      rounded-[30px]
      border
      border-cyan-500/10
      bg-gradient-to-br
      from-[#07142B]
      via-[#0A1D3D]
      to-[#07142B]
    "
          >
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Gem className="mb-5 h-12 w-12 text-cyan-400" />

              <h2 className="text-3xl font-bold text-slate-100">
                No Plans Available
              </h2>

              <p className="mt-3 max-w-lg text-slate-300">
                There are currently no subscription plans matching your search.
                Please check again later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* EMPTY PAYMENT HISTORY */}
        {activeTab === "history" && !loading && invoices.length === 0 && (
          <Card
            id="history"
            className="
      rounded-[30px]
      border
      border-cyan-500/10
      bg-gradient-to-br
      from-[#07142B]
      via-[#0A1D3D]
      to-[#07142B]
    "
          >
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <CheckCircle2 className="mb-5 h-12 w-12 text-cyan-400" />

              <h2 className="text-3xl font-bold text-slate-100">
                No Payments Yet
              </h2>

              <p className="mt-3 max-w-lg text-slate-300">
                Your invoices and payment receipts will appear here after your
                first wash or subscription purchase.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ACTIVE MEMBERSHIP EMPTY */}
        {activeTab === "membership" && !loading && member.length === 0 && (
          <Card
            id="membership"
            className="
      overflow-hidden
      rounded-[30px]
      border
      border-cyan-500/10
      bg-gradient-to-br
      from-[#07142B]
      via-[#0A1D3D]
      to-[#07142B]
    "
          >
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10">
                <Gem className="h-10 w-10 text-cyan-400" />
              </div>

              <h2 className="text-3xl font-bold text-slate-100">
                No Active Membership
              </h2>

              <p className="mt-3 max-w-xl text-slate-300">
                You don't have an active subscription yet. Subscribe to enjoy
                discounted washes, priority service and exclusive member
                benefits.
              </p>

              <Button
                onClick={() => setActiveTab("plans")}
                className="
                mt-8
                rounded-2xl
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
                "
              >
                Browse Plans
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
