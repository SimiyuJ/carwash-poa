"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Gem, CheckCircle2, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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
  /* =========================================================
     FETCH PLANS
  ========================================================= */
  useEffect(() => {
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
        const { data: customer } = await supabase
          .from("customers")
          .select("id, carwash_id, branch_id")
          .eq("profile_id", user.id)
          .single();

        if (!customer) {
          setLoading(false);
          return;
        }
        const { carwash_id, branch_id } = customer;

        // Get active subscription
        const { data: members, error: memberError } = await supabase
          .from("subscription_members")
          .select("*")
          .eq("customer_id", customer.id);

        if (memberError) {
          console.error(memberError);
        } else {
          setMember(members || []);
        }

        // Get plans
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("carwash_id", carwash_id)
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
  }, []);

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
        .single();

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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id, carwash_id, branch_id")
        .eq("profile_id", user.id)
        .single();

      if (customerError || !customer) {
        console.error(customerError);
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("carwash_id", customer.carwash_id)
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
    <div className="relative p-6 space-y-6 text-white">
      {/* =========================================================
         HEADER
      ========================================================= */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gem className="text-cyan-400" />
          Subscription Plans
        </h1>

        <p className="text-zinc-400 text-sm">
          Choose a premium wash membership that fits your lifestyle.
        </p>
      </div>

      {/* =========================================================
         SEARCH BAR
      ========================================================= */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4">
        <Search className="w-4 h-4 text-zinc-500" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plans..."
          className="border-0 bg-transparent focus-visible:ring-0 text-white"
        />
      </div>

      {/* =========================================================
         LOADING STATE
      ========================================================= */}
      {loading && (
        <div className="text-zinc-400 text-sm">
          Loading subscription plans...
        </div>
      )}

      {/* ACTIVE SUBSCRIPTION */}
      {member?.map((sub) => (
        <Card
          key={sub.id}
          className="
      mb-6 sm:mb-8

      overflow-hidden
      relative

      rounded-[28px]

      border border-cyan-500/20

      bg-gradient-to-br
      from-slate-900/95
      via-[#0b1220]
      to-[#08111f]

      backdrop-blur-2xl

      shadow-[0_0_40px_rgba(34,211,238,0.08)]
    "
        >
          {/* PREMIUM GLOW */}
          <div
            className="
        absolute inset-0
        opacity-20
        pointer-events-none

        bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.4),transparent_45%)]
      "
          />

          <CardContent className="relative p-4 sm:p-6">
            {/* HEADER */}
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="
              inline-flex
              items-center
              gap-2

              px-3 py-1

              rounded-full

              border border-cyan-500/20
              bg-cyan-500/10

              text-[10px]
              sm:text-xs

              uppercase
              tracking-[0.2em]

              text-cyan-300
            "
                >
                  <Sparkles className="w-3 h-3" />
                  Active Membership
                </div>

                <h2
                  className="
    mt-3
    text-2xl
    sm:text-4xl
    font-black
    text-white
  "
                >
                  {sub.plan}
                </h2>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-cyan-300 font-semibold">
                    {sub.plate}
                  </span>

                  <span className="text-slate-500">•</span>

                  <span className="text-slate-400 text-sm">{sub.vehicle}</span>

                  <span
                    className="
      ml-auto
      px-2 py-1
      rounded-full
      bg-cyan-500/10
      border border-cyan-500/20
      text-cyan-300
      text-xs
      font-semibold
    "
                  >
                    {sub.status}
                  </span>
                </div>

                <p className="text-slate-400 text-sm mt-1">
                  Premium Subscription Plan
                </p>
              </div>

              <div
                className="
            w-12 h-12
            sm:w-14 sm:h-14

            rounded-2xl

            bg-gradient-to-br
            from-cyan-500
            to-blue-600

            flex items-center justify-center

            shadow-[0_10px_30px_rgba(34,211,238,.25)]
          "
              >
                <Gem className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
              {/* TOTAL */}
              <div
                className="
            rounded-2xl
            border border-white/10

            bg-white/[0.03]

            p-3 sm:p-4
          "
              >
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase">
                  Total
                </p>

                <h3
                  className="
              mt-2

              text-xl
              sm:text-3xl

              font-black

              text-cyan-300
            "
                >
                  {sub.limit}
                </h3>
              </div>

              {/* USED */}
              <div
                className="
            rounded-2xl
            border border-white/10

            bg-white/[0.03]

            p-3 sm:p-4
          "
              >
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase">
                  Used
                </p>

                <h3
                  className="
              mt-2

              text-xl
              sm:text-3xl

              font-black

              text-amber-300
            "
                >
                  {sub.usage}
                </h3>
              </div>

              {/* REMAINING */}
              <div
                className="
            rounded-2xl
            border border-emerald-500/20

            bg-emerald-500/5

            p-3 sm:p-4
          "
              >
                <p className="text-[10px] sm:text-xs text-emerald-300 uppercase">
                  Left
                </p>

                <h3
                  className="
              mt-2

              text-xl
              sm:text-3xl

              font-black

              text-emerald-400
            "
                >
                  {sub.limit - sub.usage}
                </h3>
              </div>
            </div>

            {/* USAGE BAR */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Wash Usage</span>

                <span className="text-sm font-semibold text-cyan-300">
                  {Math.round((sub.usage / sub.limit) * 100)}%
                </span>
              </div>

              <Progress value={(sub.usage / sub.limit) * 100} className="h-3" />
            </div>

            {/* RENEWAL */}
            <div
              className="
          mt-6

          rounded-2xl

          border border-cyan-500/10

          bg-cyan-500/5

          p-4
        "
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Renewal Date
              </p>

              <h4
                className="
            mt-2

            text-lg
            sm:text-xl

            font-bold

            text-white
          "
              >
                {new Date(sub.renewal).toLocaleDateString()}
              </h4>

              <p className="text-slate-400 text-sm mt-1">
                Your subscription renews automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* =========================================================
         PLANS GRID
      ========================================================= */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            className="
    relative
    overflow-hidden
    rounded-3xl
    border border-cyan-500/20
    bg-gradient-to-br
    from-[#0B1220]
    via-[#111827]
    to-[#0A1020]
    backdrop-blur-xl
    shadow-[0_0_30px_rgba(6,182,212,0.08)]
    group
    transition-all
    duration-300
    hover:-translate-y-1
    hover:border-cyan-400/40
  "
          >
            {/* EDGE GLOW ON HOVER ONLY */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
              <div className="absolute inset-0 rounded-3xl border border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.25)]" />
            </div>

            {/* BACKGROUND GLOW */}
            <div
              className={`absolute inset-0 opacity-20 bg-gradient-to-br ${plan.glow}`}
            />

            <CardContent className="relative p-3 md:p-6 space-y-3">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <Gem className="text-cyan-400" />

                <span className="text-xs text-slate-300">Monthly Plan</span>
              </div>

              {/* PLAN INFO */}
              <div>
                <h2 className="text-sm md:text-xl font-bold text-white line-clamp-1">
                  {plan.name}
                </h2>

                <div
                  className="
      inline-flex
      items-center
      mt-2
      px-2 py-1
      rounded-full

      bg-cyan-500/10
      border border-cyan-500/20

      text-[10px]
      font-medium
      text-cyan-300
    "
                >
                  {plan.wash_limit} Washes
                </div>
              </div>

              {/* DESCRIPTION */}
              <p className="text-zinc-400 text-sm">{plan.description}</p>

              {/* PRICE */}
              <div className="flex items-end gap-2">
                <h1 className="text-lg md:text-3xl font-black text-white">
                  KES {plan.price.toLocaleString()}
                </h1>
                <span className="text-xs text-zinc-500 mb-1">/month</span>
              </div>
              {/* AMOUNT SAVED*/}
              {Number(plan.amount_saved) > 0 && (
                <div className=" rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3">
                  <p className="text-xs text-emerald-300 uppercase">
                    Monthly Savings
                  </p>

                  <h3 className="text-xl font-black text-emerald-400">
                    KES {Number(plan.amount_saved).toLocaleString()}
                  </h3>
                </div>
              )}

              {/* FEATURES */}
              <div className="space-y-2 pt-2">
                {plan.features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-zinc-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                disabled={subscribing}
                onClick={() => handleSubscribe(plan)}
              >
                {subscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* =========================================================
   PAYMENT HISTORY
========================================================= */}

      <div className="mt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Payment History</h2>

          <p className="text-slate-400 text-sm">
            Your recent invoices and receipts
          </p>
        </div>

        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="
          bg-slate-950
          border border-white/10
          rounded-3xl
          overflow-hidden
        "
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-cyan-400 uppercase">Receipt</p>

                    <h3 className="font-bold text-white mt-1">
                      {invoice.receipt_number}
                    </h3>

                    <p className="text-slate-400 text-sm mt-1">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-slate-500 text-xs">Amount Paid</p>

                    <h2 className="text-2xl font-black text-emerald-400">
                      KES {Number(invoice.amount_paid).toLocaleString()}
                    </h2>
                  </div>
                </div>

                {/* SERVICES */}

                {Array.isArray(invoice.services) &&
                  invoice.services.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">
                        Services
                      </p>

                      <div className="space-y-2">
                        {invoice.services.map((service: any, idx: number) => (
                          <div
                            key={idx}
                            className="
              flex items-center
              gap-3

              rounded-xl
              border border-white/5
              bg-white/[0.02]

              px-3 py-2
            "
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />

                            <span className="text-sm text-slate-300">
                              {service.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* PAYMENT META */}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className="
      px-3 py-1
      rounded-full

      bg-cyan-500/10
      border border-cyan-500/20

      text-cyan-300
      text-xs
    "
                  >
                    {invoice.payment_method}
                  </span>

                  <span
                    className="
      px-3 py-1
      rounded-full

      bg-emerald-500/10
      border border-emerald-500/20

      text-emerald-300
      text-xs
    "
                  >
                    {invoice.payment_status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* EMPTY STATE */}
      {!loading && filteredPlans.length === 0 && (
        <div className="text-center text-zinc-500 py-10">No plans found.</div>
      )}
    </div>
  );
}
