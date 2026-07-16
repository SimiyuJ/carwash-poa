"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import {
  Crown,
  Sparkles,
  Gem,
  Car,
  Users,
  Calendar,
  CheckCircle2,
  Clock3,
  QrCode,
  Gift,
  Search,
  Plus,
  Wallet,
  RefreshCcw,
  PauseCircle,
  Building2,
  MoreVertical,
  Droplets,
  X,
  Pencil,
  Trash2,
  Activity,
  MessageCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Progress } from "@/components/ui/progress";

/* =========================================================
   TYPES
========================================================= */

type Status = "active" | "expired" | "paused" | "trial";

type Health = "healthy" | "warning" | "critical";

type Tier = "Bronze" | "Silver" | "Gold" | "Diamond";

type Plan = {
  id: number;
  name: string;
  price: number;
  washes: number;
  benefits: string[];
  amount_saved: number;
  color: string;
  users: number;
  wash_limit: number;
  icon: any;
};

type Member = {
  id: number;

  name: string;
  phone: string;
  email: string;

  plan: string;

  vehicle: string;
  plate: string;

  usage: number;
  limit: number;

  status: Status;
  renewal: string;

  points: number;
  visits: number;

  autoRenew: boolean;

  health: Health;

  tier: Tier;

  birthday?: string;
  joinedDate?: string;

  referrals: number;

  notes: string[];

  vehicles?: string[];

  pauseReason?: string;

  soldBy?: string;

  history: {
    date: string;
    service: string;
    amount: number;
  }[];
};

/* =========================================================
   HELPERS
========================================================= */

const statusColor = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  expired: "bg-red-500/15 text-red-400 border-red-500/20",
  paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  trial: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

const healthColor = {
  healthy: "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.18)]",

  warning: "border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.18)]",

  critical: "border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.18)]",
};

/* =========================================================
   PAGE
========================================================= */

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("all");

  const [members, setMembers] = useState<Member[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState("members");
  const [searchMessage, setSearchMessage] = useState("");

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  /* =========================================================
     ADD MEMBER
  ========================================================= */

  const [openAddMember, setOpenAddMember] = useState(false);

  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    email: "",

    vehicle: "",
    plate: "",

    // PLAN
    plan: "",
    plan_id: null as number | string | null,
    plan_name: "",
    plan_price: 0,
    plan_benefits: [] as string[],

    // IMPORTANT (derived from plan)
    limit: 0,

    renewal: "",

    tier: "Bronze",
    usage: 0,

    status: "active",
    auto_renew: false,

    health: "healthy",
    sold_by: "",

    carwash_id: "",
    branch_id: "",

    customer_id: null as string | null,
    vehicle_id: null as string | null,
  });

  const selectedPlanData = plans.find((p) => p.name === newMember.plan);
  const [openScanQR, setOpenScanQR] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);

  const selectedSubscriptionPlan = subscriptionPlans.find(
    (plan) => String(plan.id) === String(newMember.plan_id),
  );

  const handleAddMember = async () => {
    try {
      if (
        !newMember.name ||
        !newMember.phone ||
        !newMember.vehicle ||
        !newMember.plate
      ) {
        alert("Please complete all required fields.");
        return;
      }

      const selectedPlan = subscriptionPlans.find(
        (p) => String(p.id) === String(newMember.plan_id),
      );

      const memberData = {
        name: newMember.name,
        phone: newMember.phone,
        email: newMember.email,

        vehicle_id: newMember.vehicle_id,

        plan: newMember.plan,

        vehicle: newMember.vehicle,
        plate: newMember.plate?.toUpperCase(),

        usage: 0,
        limit: newMember.limit,

        status: "active",

        renewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

        auto_renew: newMember.auto_renew,

        health: "healthy",

        tier: newMember.tier,

        sold_by: profile?.full_name ?? "Admin",

        created_at: new Date().toISOString(),

        carwash_id: profile?.carwash_id,
        branch_id: profile?.branch_id,

        customer_id: newMember.customer_id ?? null,

        services: Array.isArray(newMember.plan_benefits)
          ? newMember.plan_benefits.map((benefit) => ({
              name: benefit,
            }))
          : [],
      };

      const { data, error } = await supabase
        .from("subscription_members")
        .insert([memberData])
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }
      /* =========================================
      CREATE INVOICE
      ========================================= */
      const receiptNumber = `RCPT-${new Date().getFullYear()}-${Date.now()}`;

      const invoiceNumber = `SUB-${new Date().getFullYear()}-${Date.now()}`;

      const invoiceData = {
        invoice_number: invoiceNumber,

        receipt_number: receiptNumber,

        vehicle_id: newMember.vehicle_id,

        customer_id: newMember.customer_id,

        customer: newMember.name,

        plate: newMember.plate,

        subtotal: Number(newMember.plan_price),

        vat: 0,

        total: Number(newMember.plan_price),

        amount_paid: Number(newMember.plan_price),

        payment_status: "PAID",

        payment_method: "CASH",

        status: "completed",

        branch_id: profile?.branch_id,

        carwash_id: profile?.carwash_id,

        created_by: profile?.id,

        cashier: profile?.full_name,

        services: [
          {
            name: `${newMember.plan_name} Membership`,
            quantity: 1,
            price: Number(newMember.plan_price),
            total: Number(newMember.plan_price),
          },
        ],
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        console.error("Invoice Error:", invoiceError);
      }

      alert(
        `Subscription member created successfully.\nInvoice #: ${invoice?.invoice_number}`,
      );

      setOpenAddMember(false);

      setNewMember({
        name: "",
        phone: "",
        email: "",

        vehicle: "",
        plate: "",

        plan: "",
        plan_id: null, // <- not ""

        plan_name: "",
        plan_price: 0,

        plan_benefits: selectedPlan?.description ?? [],

        tier: "Bronze",
        usage: 0,
        limit: 0,

        status: "active",
        auto_renew: false,

        health: "healthy",
        sold_by: "",

        renewal: "",

        vehicle_id: null,

        carwash_id: "",
        branch_id: "",

        customer_id: null,
      });

      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Failed to create member.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile?.carwash_id || !profile?.branch_id) {
      return;
    }

    fetchPlans();
    fetchMembers();
  }, [profile]);

  useEffect(() => {
    if (!profile?.carwash_id) return;

    const loadPlans = async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("carwash_id", profile.carwash_id)
        .eq("branch_id", profile.branch_id)
        .order("price");

      if (error) {
        console.error("❌ Error loading plans:", error);
        return;
      }

      const formattedPlans =
        data?.map((plan) => ({
          ...plan,

          // amount saved
          amountSaved: Number(plan.amount_saved || 0),

          // benefits
          benefits: Array.isArray(plan.description)
            ? plan.description
            : typeof plan.description === "string"
              ? JSON.parse(plan.description || "[]")
              : [],

          // card values
          washes: String(plan.wash_limit || 0),

          users: plan.users || 0,

          color: plan.glow || "from-cyan-500 to-blue-600",
        })) || [];

      setSubscriptionPlans(formattedPlans);
    };
  }, [profile]);

  //renew member plan
  useEffect(() => {
    if (!selectedMember) return;

    const currentPlan = subscriptionPlans.find(
      (p) => p.name === selectedMember.plan,
    );

    if (currentPlan) {
      setSelectedPlanId(currentPlan.id);
    }
  }, [selectedMember, subscriptionPlans]);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select(
        `
    id,
    email,
    full_name,
    role,
    carwash_id,
    branch_id
  `,
      )
      .eq("id", user.id)
      .single();
    setProfile(data);
  };

  /* =========================================================
   LIVE STATS
========================================================= */

  const totalSubscribers = members.length;

  const monthlyRevenue = members.reduce((sum, member) => {
    const plan = plans.find((p) => p.name === member.plan);
    return sum + (plan?.price || 0);
  }, 0);

  const expiringSoon = members.filter((m) => {
    if (!m.renewal) return false;

    const renewalDate = new Date(m.renewal);
    const today = new Date();

    const diff =
      (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return diff <= 7 && diff >= 0;
  }).length;

  const loyaltyRewards = members.reduce((sum, m) => sum + (m.points || 0), 0);

  const activeMembers = members.filter((m) => m.status === "active").length;

  const renewalRate =
    totalSubscribers > 0
      ? Math.round((activeMembers / totalSubscribers) * 100)
      : 0;

  const fleetCount = members.filter(
    (m) => (m.vehicles?.length || 0) > 1,
  ).length;

  /* =========================================================
     CREATE PLAN
  ========================================================= */

  const [openCreatePlan, setOpenCreatePlan] = useState(false);
  useEffect(() => {
    fetchPlans();
    fetchMembers();
  }, []);

  const [openEditPlan, setOpenEditPlan] = useState(false);

  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const fetchPlans = async () => {
    if (!profile?.carwash_id || !profile?.branch_id) {
      return;
    }

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("carwash_id", profile.carwash_id)
      .eq("branch_id", profile.branch_id)
      .order("id", { ascending: false });

    if (error) {
      return;
    }

    setSubscriptionPlans(data || []);

    const formatted = (data || []).map((plan: any) => ({
      id: plan.id,

      name: plan.name || "Unnamed Plan",

      price: Number(plan.price) || 0,

      washes: Number(plan.wash_limit) || 0,

      benefits: Array.isArray(plan.description) ? plan.description : [],

      amount_saved: Number(plan.amount_saved) || 0,

      color: plan.glow || "from-cyan-500 to-blue-600",

      users: Number(plan.subscribers) || 0,

      wash_limit: Number(plan.wash_limit) || 0,

      icon: Gem,
    }));

    setPlans(formatted);
  };

  //fetch members
  const [plateSearch, setPlateSearch] = useState("");
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [searching, setSearching] = useState(false);

  const fetchMembers = async () => {
    if (!profile?.carwash_id || !profile?.branch_id) return;

    const { data, error } = await supabase
      .from("subscription_members")
      .select("*")
      .eq("carwash_id", profile.carwash_id)
      .eq("branch_id", profile.branch_id)
      .order("id", { ascending: false });

    if (error) {
      console.error("❌ Error fetching members:", error.message);
      return;
    }

    const formatted: Member[] = (data || []).map((m: any) => ({
      ...m,
      autoRenew: m.auto_renew,
      soldBy: m.sold_by,
      history: m.history || [],
      vehicles: m.vehicles || [],
    }));

    setMembers(formatted);
  };

  type NewPlan = {
    name: string;
    price: string;
    washes: string;
    benefits: string;
    color: string;
  };

  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    washes: "",
    benefits: "",
    amountSaved: 0,
    color: "from-cyan-500 to-blue-600",
  });

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.price || !newPlan.washes) return;

    const planData = {
      name: newPlan.name,

      price: Number(newPlan.price),

      interval: "monthly",

      wash_limit: Number(newPlan.washes) || 0,

      amount_saved: Number(newPlan.amountSaved || 0),

      description: newPlan.benefits
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),

      popular: false,

      glow: newPlan.color,

      carwash_id: profile?.carwash_id,

      branch_id: profile?.branch_id,
    };

    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .insert([planData])
        .select()
        .single();

      if (error) {
        console.error("❌ Error creating plan:", error.message);
        return;
      }

      const createdPlan: Plan = {
        id: data.id,

        name: data.name,

        price: Number(data.price),

        washes: Number(data.wash_limit || 0),

        benefits: Array.isArray(data.description)
          ? data.description
          : typeof data.description === "string"
            ? JSON.parse(data.description || "[]")
            : [],

        color: data.glow,

        users: 0,

        wash_limit: Number(data.wash_limit || 0),

        amount_saved: Number(data.amount_saved || 0),

        icon: Gem,
      };

      setPlans((prev) => [createdPlan, ...prev]);

      setNewPlan({
        name: "",
        price: "",
        washes: "",
        benefits: "",
        amountSaved: 0,
        color: "from-cyan-500 to-blue-600",
      });

      setOpenCreatePlan(false);
    } catch (error) {
      console.error("❌ Create Plan Error:", error);
    }
  };

  //handle change member plan
  const handleChangePlan = async () => {
    if (!editingMember || !selectedPlanId) return;

    const plan = subscriptionPlans.find((p) => p.id === selectedPlanId);

    if (!plan) return;

    try {
      const nextRenewal = new Date();
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);

      const { error } = await supabase
        .from("subscription_members")
        .update({
          plan: plan.name,
          limit: Number(plan.wash_limit),
          usage: 0,
          renewal: nextRenewal.toISOString(),
          services: plan.description || [],
        })
        .eq("id", editingMember.id);

      if (error) throw error;

      alert("Plan updated successfully");

      fetchMembers();

      setOpenEditPlan(false);
    } catch (error) {
      console.error(error);

      alert("Failed to update plan");
    }
  };

  /*delete plan*/

  const handleDeletePlan = async (id: number) => {
    if (!confirm("Delete this subscription plan?")) return;

    await supabase.from("subscription_plans").delete().eq("id", id);

    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  //Renew members plan

  const handleRenewMembership = async (member: any) => {
    try {
      const plan = subscriptionPlans.find((p) => p.id === member.plan_id);

      const nextRenewal = new Date();

      switch (plan?.interval) {
        case "weekly":
          nextRenewal.setDate(nextRenewal.getDate() + 7);
          break;

        case "yearly":
          nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
          break;

        default:
          nextRenewal.setMonth(nextRenewal.getMonth() + 1);
          break;
      }

      const { error } = await supabase
        .from("subscription_members")
        .update({
          renewal: nextRenewal.toISOString(),
          usage: 0,
          status: "active",
        })
        .eq("id", member.id);

      if (error) throw error;

      await fetchMembers();

      alert(`${member.name}'s membership renewed successfully`);
    } catch (error) {
      console.error(error);

      alert("Failed to renew membership");
    }
  };

  /* =========================================================
     FILTER MEMBERS
  ========================================================= */

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.plate.toLowerCase().includes(search.toLowerCase()) ||
        member.vehicle.toLowerCase().includes(search.toLowerCase());

      const matchesPlan =
        selectedPlan === "all" || member.plan === selectedPlan;

      return matchesSearch && matchesPlan;
    });
  }, [search, selectedPlan, members]);

  //fetchmember by plate
  const findMemberByPlate = async () => {
    const plateInput = plateSearch.trim().toUpperCase();

    if (!plateInput) return;

    setSearching(true);
    setFoundMember(null);
    setSearchMessage("");

    try {
      /* ----------------------------------------
         STEP 1: FIND VEHICLE
      ---------------------------------------- */

      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("plate_number", plateInput)
        .maybeSingle();

      if (vehicleError) {
        console.error(vehicleError);
        return;
      }

      if (!vehicle) {
        return;
      }

      /* ----------------------------------------
         STEP 2: FIND CUSTOMER
      ---------------------------------------- */

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", vehicle.customer_id)
        .maybeSingle();

      if (customerError) {
        console.error(customerError);
        return;
      }

      if (!vehicle) {
        setSearchMessage(
          `Vehicle not found for plate ${plateInput}. Kindly register the customer.`,
        );
        setFoundMember(null);

        setSearching(false);
        return;
      }

      /* ----------------------------------------
         STEP 3: CHECK IF ALREADY SUBSCRIBED
      ---------------------------------------- */

      const { data: existingMember } = await supabase
        .from("subscription_members")
        .select("id")
        .eq("plate", plateInput)
        .maybeSingle();

      if (existingMember) {
        alert("Customer is already subscribed.");
        return;
      }

      /* ----------------------------------------
         STEP 4: BUILD MEMBER OBJECT
      ---------------------------------------- */

      const memberData: Member = {
        id: Number(Date.now()),

        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",

        vehicle: vehicle.type || "",
        plate: vehicle.plate_number || "",

        plan: "",

        usage: 0,
        limit: 0,

        status: "active",
        renewal: "",

        points: customer.loyalty_points || 0,
        visits: 0,

        autoRenew: false,

        health: "healthy",

        tier: customer.loyalty_level || "Bronze",

        referrals: 0,

        notes: [],

        history: [],
      };

      setFoundMember(memberData);

      /* ----------------------------------------
         STEP 5: AUTO FILL FORM
      ---------------------------------------- */

      setNewMember({
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",

        vehicle: vehicle?.type ?? "",
        plate: vehicle?.plate_number ?? "",

        plan:
          plans?.length > 0
            ? (plans[0]?.name ?? "Basic Wash Club")
            : "Basic Wash Club",

        plan_id: "",
        plan_name: "",
        plan_price: 0,
        plan_benefits: [],
        renewal: "",

        tier: "Bronze",
        usage: 0,
        limit: 0,

        status: "active",
        auto_renew: false,

        health: "healthy",
        sold_by: profile?.full_name ?? "Admin",

        carwash_id: profile?.carwash_id ?? "",
        branch_id: profile?.branch_id ?? "",

        customer_id: vehicle?.customer_id ?? customer?.id ?? null,
        vehicle_id: vehicle?.id ?? null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  //edit plan
  const handleEditPlan = (plan: Plan) => {
    // We'll implement editing later.
  };

  //tabs color
  const tabs = [
    {
      value: "members",
      label: "Members",
      color: {
        border: "border-cyan-500/40",
        text: "text-cyan-400",
        hover: "hover:bg-cyan-500/10",
        active:
          "data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-400",
      },
    },

    {
      value: "analytics",
      label: "Analytics",
      color: {
        border: "border-emerald-500/40",
        text: "text-emerald-400",
        hover: "hover:bg-emerald-500/10",
        active:
          "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-400",
      },
    },

    {
      value: "renewals",
      label: "Renewals",
      color: {
        border: "border-amber-500/40",
        text: "text-amber-400",
        hover: "hover:bg-amber-500/10",
        active:
          "data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:border-amber-400",
      },
    },

    {
      value: "loyalty",
      label: "Loyalty",
      color: {
        border: "border-violet-500/40",
        text: "text-violet-400",
        hover: "hover:bg-violet-500/10",
        active:
          "data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-300 data-[state=active]:border-violet-400",
      },
    },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12 lg:px-8 lg:pt-10 lg:pb-14 xl:px-10 2xl:px-12">
      {/* Background Effects */}

      <div className="pointer-events-none absolute inset-0">
        {/* Main background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08182F] via-[#071325] to-[#040914]" />

        {/* Top glow */}
        <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />

        {/* Left glow */}
        <div className="absolute top-40 -left-32 h-[320px] w-[320px] rounded-full bg-sky-500/5 blur-[120px]" />

        {/* Right glow */}
        <div className="absolute -right-24 bottom-20 h-[320px] w-[320px] rounded-full bg-blue-500/5 blur-[120px]" />

        {/* Grid */}
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.03]" />
      </div>

      {/* Page Content */}

      <div className="relative z-10 mx-auto w-full max-w-[1700px] space-y-8 lg:space-y-10">
        {/* =========================================================
        HEADER
        ========================================================= */}

        <div className="relative overflow-hidden rounded-[34px] border border-cyan-500/15 bg-gradient-to-br from-[#081A33] via-[#091B37] to-[#071426] p-5 shadow-[0_20px_70px_rgba(0,0,0,.35)] sm:p-7 lg:p-8">
          {/* Background Glow */}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_45%)]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            {/* LEFT */}

            <div className="min-w-0">
              {/* Badge */}

              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-300">
                <Gem className="h-4 w-4" />
                Recurring Revenue Center
              </div>

              {/* Title */}

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 shadow-[0_20px_45px_rgba(34,211,238,.35)] sm:h-20 sm:w-20">
                  <Gem className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl xl:text-5xl">
                    Subscriptions
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                    Manage memberships, recurring billing, fleet accounts,
                    customer loyalty and subscription revenue from one
                    dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <Button
                onClick={() => setOpenCreatePlan(true)}
                className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-7 font-semibold shadow-[0_12px_35px_rgba(34,211,238,.30)] transition-all duration-300 hover:scale-[1.03]"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Plan
              </Button>

              <Button
                onClick={() => setOpenScanQR(true)}
                variant="outline"
                className="h-14 rounded-2xl border-white/10 bg-white/[0.03] px-7 text-white backdrop-blur-xl hover:border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <QrCode className="mr-2 h-5 w-5 text-cyan-400" />
                Scan QR
              </Button>
            </div>
          </div>
        </div>

        {/* =========================================================
    TOP STATS
========================================================= */}

        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
          {[
            {
              title: "Subscribers",
              value: totalSubscribers,
              subtitle: "Members",
              icon: Users,
              gradient: "from-cyan-500 via-sky-500 to-blue-500",
              glow: "bg-cyan-500/30",
              border: "border-cyan-500/20",
              iconBg: "bg-cyan-500/10",
              iconBorder: "border-cyan-400/20",
              color: "text-cyan-400",
            },
            {
              title: "Revenue",
              value: monthlyRevenue.toLocaleString(),
              prefix: "KES",
              subtitle: "This Month",
              icon: Wallet,
              gradient: "from-emerald-500 via-green-500 to-lime-500",
              glow: "bg-emerald-500/30",
              border: "border-emerald-500/20",
              iconBg: "bg-emerald-500/10",
              iconBorder: "border-emerald-400/20",
              color: "text-emerald-400",
            },
            {
              title: "Renewals",
              value: `${renewalRate}%`,
              subtitle: "Retention",
              icon: RefreshCcw,
              gradient: "from-amber-500 via-orange-500 to-yellow-500",
              glow: "bg-yellow-500/30",
              border: "border-yellow-500/20",
              iconBg: "bg-yellow-500/10",
              iconBorder: "border-yellow-400/20",
              color: "text-yellow-400",
            },
            {
              title: "Expiring",
              value: expiringSoon,
              subtitle: "Attention",
              icon: Clock3,
              gradient: "from-rose-500 via-red-500 to-pink-500",
              glow: "bg-red-500/30",
              border: "border-red-500/20",
              iconBg: "bg-red-500/10",
              iconBorder: "border-red-400/20",
              color: "text-red-400",
            },
            {
              title: "Rewards",
              value: loyaltyRewards,
              subtitle: "Loyal",
              icon: Gift,
              gradient: "from-violet-500 via-fuchsia-500 to-pink-500",
              glow: "bg-violet-500/30",
              border: "border-violet-500/20",
              iconBg: "bg-violet-500/10",
              iconBorder: "border-violet-400/20",
              color: "text-violet-400",
            },
            {
              title: "Corporate",
              value: fleetCount,
              subtitle: "Fleet",
              icon: Building2,
              gradient: "from-indigo-500 via-blue-500 to-sky-500",
              glow: "bg-indigo-500/30",
              border: "border-indigo-500/20",
              iconBg: "bg-indigo-500/10",
              iconBorder: "border-indigo-400/20",
              color: "text-indigo-400",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;

            return (
              <Card
                key={index}
                className={`group relative overflow-hidden rounded-[24px] border ${stat.border} bg-gradient-to-br from-[#081325] via-[#0A1830] to-[#06101F] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,.35)]`}
              >
                {/* Glow */}
                <div
                  className={`absolute -top-10 -right-10 h-24 w-24 rounded-full blur-3xl ${stat.glow}`}
                />

                {/* Top Accent */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                />

                {/* Decorative Ring */}
                <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full border border-white/5" />

                <CardContent className="relative p-3 sm:p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-semibold tracking-[0.22em] text-slate-500 uppercase sm:text-[10px]">
                        {stat.title}
                      </p>
                    </div>

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border sm:h-10 sm:w-10 ${stat.iconBorder} ${stat.iconBg} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                  </div>

                  {/* Number */}

                  <div className="mt-3">
                    {stat.prefix ? (
                      <div>
                        <h2 className="truncate text-lg leading-none font-black text-white sm:text-2xl">
                          <span className="mr-1 text-[11px] font-semibold text-slate-400 sm:text-xs">
                            {stat.prefix}
                          </span>

                          {stat.value}
                        </h2>
                      </div>
                    ) : (
                      <h2 className="truncate text-2xl leading-none font-black text-white sm:text-3xl">
                        {stat.value}
                      </h2>
                    )}

                    <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                      {stat.subtitle}
                    </p>
                  </div>

                  {/* Bottom Accent */}

                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full w-2/3 rounded-full bg-gradient-to-r ${stat.gradient}`}
                      />
                    </div>

                    <div
                      className={`h-2 w-2 rounded-full ${stat.glow} animate-pulse`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* =========================================================
    CREATE PLAN
    ========================================================= */}

        {openCreatePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
            <div className="group relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-zinc-950">
              {/* HOVER EDGE GLOW ONLY */}
              <div className="pointer-events-none absolute inset-0 rounded-[32px] opacity-0 transition-all duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 rounded-[32px] border border-cyan-400/30 shadow-[0_0_25px_rgba(34,211,238,0.35)]" />
              </div>

              {/* edge glow */}
              <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-cyan-400/10 shadow-[0_0_25px_rgba(34,211,238,.12)]" />

              {/* background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,.18),transparent_40%)] opacity-30" />

              <div className="relative p-8">
                {/* HEADER */}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                      <Gem className="h-3 w-3" />
                      PREMIUM PLAN BUILDER
                    </div>

                    <h2 className="text-3xl font-black">
                      Create Subscription Plan
                    </h2>

                    <p className="mt-2 text-zinc-400">
                      Design premium recurring memberships with perks, pricing
                      and branding.
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setOpenCreatePlan(false)}
                    className="rounded-2xl border border-zinc-800 bg-black/40 hover:bg-red-500/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
                  {/* LEFT FORM */}

                  <div className="space-y-5">
                    {/* PLAN NAME */}

                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Plan Name</label>

                      <div className="flex items-center rounded-2xl border border-zinc-800 bg-black px-4">
                        <Crown className="h-4 w-4 text-cyan-400" />

                        <Input
                          value={newPlan.name}
                          onChange={(e) =>
                            setNewPlan({
                              ...newPlan,
                              name: e.target.value,
                            })
                          }
                          placeholder="Bronze, Silver, Gold, Diamond"
                          className="border-0 bg-transparent text-white placeholder:text-zinc-500 focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    {/* PRICE + WASHES */}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">
                          Monthly Price
                        </label>

                        <div className="flex items-center rounded-2xl border border-zinc-800 bg-black px-4">
                          <Wallet className="h-4 w-4 text-emerald-400" />

                          <Input
                            type="number"
                            value={newPlan.price}
                            onChange={(e) =>
                              setNewPlan({
                                ...newPlan,
                                price: e.target.value,
                              })
                            }
                            placeholder="15000"
                            className="border-0 bg-transparent text-white placeholder:text-zinc-500 focus-visible:ring-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">
                          Wash Limit
                        </label>

                        <div className="flex items-center rounded-2xl border border-zinc-800 bg-black px-4">
                          <Droplets className="h-4 w-4 text-cyan-400" />

                          <Input
                            value={newPlan.washes}
                            onChange={(e) =>
                              setNewPlan({
                                ...newPlan,
                                washes: e.target.value,
                              })
                            }
                            placeholder="5"
                            className="border-0 bg-transparent text-white placeholder:text-zinc-500 focus-visible:ring-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BENEFITS */}

                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Package</label>

                      <Input
                        value={newPlan.benefits}
                        onChange={(e) =>
                          setNewPlan({
                            ...newPlan,
                            benefits: e.target.value,
                          })
                        }
                        placeholder="Underwash, Engine wash, Air refreshener"
                        className="h-14 rounded-2xl border-zinc-800 bg-black text-white placeholder:text-zinc-500"
                      />
                    </div>

                    {/* THEME */}

                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">
                        Card Theme
                      </label>

                      <Select
                        value={newPlan.color}
                        onValueChange={(value) =>
                          setNewPlan({
                            ...newPlan,
                            color: value,
                          })
                        }
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-zinc-800 bg-black text-white">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="from-cyan-500 to-blue-600">
                            Cyan Blue
                          </SelectItem>

                          <SelectItem value="from-yellow-500 to-orange-500">
                            Gold Orange
                          </SelectItem>

                          <SelectItem value="from-violet-500 to-fuchsia-500">
                            Purple Pink
                          </SelectItem>

                          <SelectItem value="from-emerald-500 to-green-600">
                            Emerald Green
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* RIGHT LIVE PREVIEW */}

                  <div>
                    <div
                      className={`min-h-[340px] rounded-3xl bg-gradient-to-br p-6 ${newPlan.color} flex flex-col justify-between shadow-xl`}
                    >
                      <div>
                        <Gem className="h-10 w-10" />

                        <h2 className="mt-6 text-2xl font-black">
                          {newPlan.name || "Diamond VIP"}
                        </h2>

                        <p className="mt-2 text-sm text-white/70">
                          {newPlan.washes || "Unlimited Washes"}
                        </p>
                      </div>

                      <div>
                        <h1 className="text-4xl font-black">
                          KES {newPlan.price || "1500"}
                        </h1>

                        <p className="text-sm text-white/70">
                          Monthly Subscription
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="mt-8 flex justify-end gap-4 border-t border-zinc-900 pt-8">
                  <Button
                    variant="outline"
                    onClick={() => setOpenCreatePlan(false)}
                    className="rounded-2xl border-zinc-800 bg-black"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleCreatePlan}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
          ADD MEMBER MODAL
      ========================================================= */}
        {(openAddMember || openScanQR) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              {/* =====================================================
         HEADER
         ===================================================== */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {openScanQR ? "Scan Member QR" : "Add / Find Member"}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-400">
                    {openScanQR
                      ? "Scan QR to fetch existing member"
                      : "Search by plate or create new member"}
                  </p>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setOpenAddMember(false);
                    setOpenScanQR(false);
                    setFoundMember(null);
                    setPlateSearch("");
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* =====================================================
         QR SCAN MODE
      ===================================================== */}
              {openScanQR && (
                <div className="space-y-5">
                  <div className="relative flex aspect-square w-full items-center justify-center rounded-3xl border border-zinc-800 bg-black">
                    <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]" />

                    <p className="text-sm text-zinc-500">
                      Camera feed will appear here
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600">
                      Start Scan
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-zinc-800 bg-black"
                      onClick={() => setOpenScanQR(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* =====================================================
            ADD MEMBER MODE (PLATE SEARCH + FORM)
            ===================================================== */}
              {openAddMember &&
                createPortal(
                  <div className="scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent max-h-[85vh] space-y-8 overflow-y-auto p-8">
                    <div className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-6 backdrop-blur-xl">
                      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-cyan-500/10 bg-slate-950/95 shadow-[0_0_60px_rgba(6,182,212,0.15)] backdrop-blur-xl">
                        {/* 🔎 HEADER */}
                        <div className="sticky top-0 z-20 border-b border-cyan-500/10 bg-slate-950/95 px-8 py-6 backdrop-blur-xl">
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="text-3xl font-bold text-white">
                                Add Subscription Member
                              </h2>

                              <p className="mt-1 text-slate-400">
                                Register customer and assign a membership plan.
                              </p>
                            </div>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setOpenAddMember(false);
                                setFoundMember(null);
                                setPlateSearch("");
                              }}
                              className="rounded-2xl bg-white/5 hover:bg-white/10"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        {/* 🔎 PLATE SEARCH */}
                        <div className="border-b border-white/5 p-6">
                          <div className="mb-4">
                            <h3 className="font-semibold text-white">
                              Customer Lookup
                            </h3>

                            <p className="text-sm text-slate-400">
                              Search using Plate Number.
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <Input
                              value={plateSearch}
                              onChange={(e) => setPlateSearch(e.target.value)}
                              placeholder="KDA123A"
                              className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500"
                            />

                            <Button
                              onClick={findMemberByPlate}
                              disabled={searching}
                              className="h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6"
                            >
                              {searching ? (
                                <>
                                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                                  Searching
                                </>
                              ) : (
                                <>
                                  <Search className="mr-2 h-4 w-4" />
                                  Find Customer
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* 🧠 FOUND MEMBER */}
                        {foundMember && (
                          <div className="p-6">
                            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-cyan-300">
                                    Customer Found
                                  </h4>

                                  <p className="mt-1 text-white">
                                    {foundMember.name}
                                  </p>

                                  <p className="text-sm text-slate-400">
                                    {foundMember.vehicle} • {foundMember.plate}
                                  </p>
                                </div>

                                <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                  Ready for Subscription
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* =====================================================
                  MEMBER DETAILS
                  ===================================================== */}

                        <div className="space-y-5">
                          {/* CUSTOMER INFO */}
                          <div className="space-y-4 rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-5">
                            <div>
                              <h3 className="font-semibold text-white">
                                Customer Information
                              </h3>

                              <p className="text-sm text-slate-400">
                                Member contact and account details.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Full Name
                                </label>

                                <Input
                                  value={newMember.name}
                                  onChange={(e) =>
                                    setNewMember({
                                      ...newMember,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. John Mwangi"
                                  className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Mobile Number
                                </label>

                                <Input
                                  value={newMember.phone}
                                  onChange={(e) =>
                                    setNewMember({
                                      ...newMember,
                                      phone: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. 0712345678"
                                  className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500"
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Email Address
                                </label>

                                <Input
                                  value={newMember.email}
                                  onChange={(e) =>
                                    setNewMember({
                                      ...newMember,
                                      email: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. john@email.com"
                                  className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* VEHICLE INFO */}
                          <div className="space-y-4 rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-5">
                            <div>
                              <h3 className="font-semibold text-white">
                                Vehicle Information
                              </h3>

                              <p className="text-sm text-slate-400">
                                Vehicle linked to this subscription.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Vehicle Type
                                </label>

                                <Input
                                  value={newMember.vehicle}
                                  onChange={(e) =>
                                    setNewMember({
                                      ...newMember,
                                      vehicle: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Toyota Prado"
                                  className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Registration Plate
                                </label>

                                <Input
                                  value={newMember.plate}
                                  onChange={(e) =>
                                    setNewMember({
                                      ...newMember,
                                      plate: e.target.value.toUpperCase(),
                                    })
                                  }
                                  placeholder="e.g. KDA 123A"
                                  className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* SUBSCRIPTION */}
                          <div className="space-y-4 rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-5">
                            <div>
                              <h3 className="font-semibold text-white">
                                Subscription Settings
                              </h3>

                              <p className="text-sm text-slate-400">
                                Configure membership plan and status.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              {/* PLAN */}
                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Membership Plan
                                </label>

                                <Select
                                  value={String(newMember.plan_id || "")}
                                  onValueChange={(value) => {
                                    const selectedPlan = subscriptionPlans.find(
                                      (p) => String(p.id) === String(value),
                                    );

                                    if (!selectedPlan) return;

                                    setNewMember((prev) => ({
                                      ...prev,

                                      plan_id: selectedPlan.id,
                                      plan: selectedPlan.name,
                                      plan_name: selectedPlan.name,
                                      plan_price: selectedPlan.price,

                                      // IMPORTANT FIX
                                      plan_benefits:
                                        selectedPlan.description || [],

                                      limit: selectedPlan.wash_limit ?? 0,
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500">
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {subscriptionPlans.map((plan) => (
                                      <SelectItem
                                        key={plan.id}
                                        value={String(plan.id)}
                                      >
                                        {plan.name} • KES{" "}
                                        {plan.price.toLocaleString()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* STATUS */}
                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Plan Benefits
                                </label>

                                <div className="min-h-[120px] rounded-2xl border border-cyan-500/10 bg-slate-900/40 p-4">
                                  {selectedSubscriptionPlan ? (
                                    <div className="space-y-2">
                                      {Array.isArray(
                                        newMember.plan_benefits,
                                      ) ? (
                                        newMember.plan_benefits.map(
                                          (benefit: string, index: number) => (
                                            <div
                                              key={index}
                                              className="flex items-center gap-2 text-sm text-white"
                                            >
                                              ✓ {benefit}
                                            </div>
                                          ),
                                        )
                                      ) : (
                                        <p className="text-sm text-slate-500">
                                          Select a membership plan to view
                                          included benefits.
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-500">
                                      Select a membership plan to view included
                                      benefits.
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* TIER */}
                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Loyalty Tier
                                </label>

                                <Select
                                  value={newMember.tier}
                                  onValueChange={(value) =>
                                    setNewMember({
                                      ...newMember,
                                      tier: value as any,
                                    })
                                  }
                                >
                                  <SelectTrigger className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500">
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="Bronze">
                                      Bronze
                                    </SelectItem>
                                    <SelectItem value="Silver">
                                      Silver
                                    </SelectItem>
                                    <SelectItem value="Gold">Gold</SelectItem>
                                    <SelectItem value="Diamond">
                                      Diamond
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* RENEWAL */}
                              <div className="space-y-2">
                                <label className="text-xs tracking-wider text-slate-400 uppercase">
                                  Renewal Date
                                </label>

                                <Input
                                  type="date"
                                  value={newMember.renewal}
                                  onChange={(e) =>
                                    setNewMember({
                                      ...newMember,
                                      renewal: e.target.value,
                                    })
                                  }
                                  className="rounded-2xl border-white/5 bg-slate-900/40 text-white placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* AUTO RENEW */}
                          <div className="rounded-3xl border border-cyan-500/15 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 p-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-white">
                                  Automatic Renewal
                                </h4>

                                <p className="text-sm text-slate-400">
                                  Renew this membership automatically every
                                  billing cycle.
                                </p>
                              </div>

                              <input
                                type="checkbox"
                                checked={newMember.auto_renew}
                                onChange={(e) =>
                                  setNewMember({
                                    ...newMember,
                                    auto_renew: e.target.checked,
                                  })
                                }
                                className="h-5 w-5"
                              />
                            </div>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3 border-t border-zinc-900 pt-4">
                          <Button
                            variant="outline"
                            className="rounded-2xl border-zinc-800 bg-black"
                            onClick={() => {
                              setOpenAddMember(false);
                              setFoundMember(null);
                              setPlateSearch("");
                            }}
                          >
                            Cancel
                          </Button>

                          <Button
                            onClick={handleAddMember}
                            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600"
                          >
                            Save Member
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}
            </div>
          </div>
        )}

        {/* =========================================================
          MEMBER PROFILE MODAL
          ========================================================= */}

        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-5xl space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{selectedMember.name}</h2>

                  <p className="mt-1 text-zinc-400">
                    {selectedMember.plan} • {selectedMember.tier} Tier
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMember(null)}
                  className="rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Card className="overflow-hidden rounded-3xl border-zinc-800 bg-black">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/70">
                          DIGITAL MEMBER PASS
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-white">
                          {selectedMember.plan}
                        </h2>
                      </div>

                      <QrCode className="h-16 w-16 text-white" />
                    </div>
                  </div>

                  <CardContent className="space-y-4 p-6">
                    <div>
                      <p className="text-sm text-zinc-500">Member</p>

                      <h3 className="mt-1 text-xl font-bold">
                        {selectedMember.name}
                      </h3>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">Vehicle</p>

                      <h3 className="mt-1 font-semibold">
                        {selectedMember.vehicle}
                      </h3>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">Plate</p>

                      <h3 className="mt-1 font-semibold">
                        {selectedMember.plate}
                      </h3>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-5 xl:col-span-2">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="rounded-3xl border-zinc-800 bg-black">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-500">
                              Loyalty Points
                            </p>

                            <h2 className="mt-2 text-3xl font-black">
                              {selectedMember.points}
                            </h2>
                          </div>

                          <Gift className="h-10 w-10 text-yellow-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-zinc-800 bg-black">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-500">Referrals</p>

                            <h2 className="mt-2 text-3xl font-black">
                              {selectedMember.referrals}
                            </h2>
                          </div>

                          <Users className="h-10 w-10 text-cyan-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-zinc-800 bg-black">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-500">Visits</p>

                            <h2 className="mt-2 text-3xl font-black">
                              {selectedMember.visits}
                            </h2>
                          </div>

                          <Activity className="h-10 w-10 text-emerald-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-3xl border-zinc-800 bg-black">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold">Wash History</h3>

                          <p className="mt-1 text-sm text-zinc-500">
                            Recent member activity.
                          </p>
                        </div>

                        <Button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </Button>
                      </div>

                      {selectedMember.history.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-2xl border border-zinc-900 bg-zinc-950 p-4"
                        >
                          <div>
                            <h4 className="font-semibold">{item.service}</h4>

                            <p className="mt-1 text-sm text-zinc-500">
                              {item.date}
                            </p>
                          </div>

                          <Badge className="rounded-full border border-cyan-500/20 bg-cyan-500/15 text-cyan-400">
                            KES {item.amount}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================
                            EDIT PLAN MODAL
                            ========================= */}

        {openEditPlan && editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6">
              <h2 className="mb-2 text-2xl font-bold">
                Change Subscription Plan
              </h2>

              <p className="mb-6 text-slate-400">{editingMember.name}</p>

              <Select
                value={String(selectedPlanId)}
                onValueChange={(value) => setSelectedPlanId(Number(value))}
              >
                <SelectTrigger className="h-14 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {subscriptionPlans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.name} — KES {plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setOpenEditPlan(false)}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleChangePlan}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
          TABS
          ========================================================= */}

        <Tabs defaultValue="members" className="space-y-6">
          <div className="scrollbar-hide overflow-x-auto pb-3">
            <TabsList className="inline-flex min-w-max items-center gap-4 border-0 bg-transparent p-0 shadow-none">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`h-12 rounded-full border bg-white/[0.02] px-8 text-[15px] font-semibold backdrop-blur-xl transition-all duration-300 ${tab.color.border} ${tab.color.text} ${tab.color.hover} ${tab.color.active} hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,.25)] data-[state=active]:scale-100 data-[state=active]:shadow-[0_10px_30px_rgba(0,0,0,.35)]`}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="members" className="space-y-6">
            {/* SEARCH + FILTER BAR */}

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 p-5 backdrop-blur-xl">
              <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
                <div className="flex h-14 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4">
                  <Search className="h-4 w-4 text-cyan-400" />

                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search member, vehicle or plate..."
                    className="border-0 bg-transparent text-white focus-visible:ring-0"
                  />
                </div>

                <div className="flex gap-3">
                  <Select onValueChange={setSelectedPlan} defaultValue="all">
                    <SelectTrigger className="h-14 w-[220px] rounded-2xl border-white/10 bg-black/30">
                      <SelectValue placeholder="Filter Plans" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>

                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.name}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => setOpenAddMember(true)}
                    className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>
              </div>
            </div>

            {/* MEMBER CARDS */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {filteredMembers.map((member) => {
                const usagePercentage =
                  member.limit > 0 ? (member.usage / member.limit) * 100 : 0;

                return (
                  <div
                    key={member.id}
                    className="group rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                  >
                    {/* EDGE GLOW */}
                    <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-all duration-500 group-hover:opacity-100">
                      <div className="absolute inset-0 rounded-3xl border border-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.15)]" />
                    </div>
                    {/* HEADER */}

                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500 via-blue-500 to-violet-600 text-2xl font-black shadow-[0_15px_30px_rgba(0,0,0,.35)]">
                          {member.name?.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white">
                              {member.name}
                            </h3>

                            <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/15 text-emerald-400">
                              {member.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <Gem className="h-4 w-4 text-yellow-400" />

                            <span className="text-xs tracking-[0.15em] text-yellow-400 uppercase">
                              {member.plan}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-xl"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* INFO */}

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-cyan-500/20">
                        <p className="text-xs text-zinc-500">Vehicle</p>

                        <div className="mt-2 flex items-center gap-2">
                          <Car className="h-4 w-4 text-cyan-400" />

                          <span className="font-semibold">
                            {member.vehicle}
                          </span>
                        </div>

                        <p className="mt-1 text-zinc-400">{member.plate}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-cyan-500/20">
                        <p className="text-xs text-zinc-500">Renewal Date</p>

                        <div className="mt-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-yellow-400" />

                          <span className="font-semibold">
                            {member.renewal}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* USAGE */}

                    <div className="mt-6">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-zinc-400">Wash Usage</span>

                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm font-bold text-cyan-300">
                          {member.usage}/{member.limit}
                        </span>
                      </div>

                      <Progress value={usagePercentage} className="h-3" />
                    </div>

                    {/* AI CARD */}

                    <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <div className="flex gap-3">
                        <Sparkles className="mt-1 h-5 w-5 text-cyan-400" />

                        <div>
                          <p className="font-semibold text-cyan-300">
                            AI Recommendation
                          </p>

                          <p className="mt-1 text-sm text-zinc-300">
                            {member.usage >= member.limit - 1
                              ? "Customer is approaching their wash limit. Consider suggesting an upgrade."
                              : "Customer engagement looks healthy and recurring."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                      <div>
                        <p className="text-[11px] tracking-[0.15em] text-slate-500 uppercase">
                          Membership Health
                        </p>

                        <p className="text-lg font-black text-emerald-400">
                          Healthy
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            alert("CHANGE PLAN CLICKED");

                            setEditingMember(member);

                            const currentPlan = subscriptionPlans.find(
                              (p) => p.name === member.plan,
                            );

                            setSelectedPlanId(currentPlan?.id || null);

                            setOpenEditPlan(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Change Plan
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            alert("Renew clicked");
                            handleRenewMembership(member);
                          }}
                          className="rounded-2xl border-white/10 bg-black/20 hover:bg-cyan-500/10"
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Renew
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* =========================================================
          PLANS SECTION
      ========================================================= */}

          <div className="mt-10">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Membership Plans</h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Premium recurring subscription tiers
                </p>
              </div>
            </div>

            {/* PLANS GRID */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan, i) => {
                const Icon = plan.icon;
                const isPopular = plan.name.toLowerCase().includes("gold");

                return (
                  <div
                    key={i}
                    className="group relative flex min-h-[500px] flex-col justify-between overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/95 to-[#08122c] p-6 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2"
                  >
                    {/* glow */}
                    <div
                      className={`absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 blur-2xl transition group-hover:opacity-100 ${plan.color}`}
                    />

                    <div className="relative space-y-4">
                      {/* HEADER */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${plan.color} shadow-[0_15px_35px_rgba(0,0,0,.35)]`}
                        >
                          <Icon className="h-8 w-8 text-white" />
                        </div>

                        {isPopular && (
                          <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] text-yellow-400">
                            POPULAR
                          </span>
                        )}
                      </div>

                      {/* TITLE */}
                      <div>
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <p className="text-xs text-zinc-500">{plan.washes}</p>
                      </div>

                      {/* PRICE */}
                      <div className="flex items-end gap-2">
                        <h2 className="text-2xl font-bold">
                          KES {plan.price.toLocaleString()}
                        </h2>
                        <span className="mb-1 text-xs text-zinc-500">
                          /month
                        </span>
                      </div>

                      {/* SAVINGS */}
                      {Number(plan.amount_saved ?? 0) > 0 && (
                        <div className="relative mt-5 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-5 py-4">
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.6),transparent_60%)] opacity-20" />

                          <p className="relative text-[11px] tracking-[0.25em] text-emerald-300 uppercase">
                            Monthly Savings
                          </p>

                          <h3 className="relative mt-1 text-3xl font-black text-emerald-400">
                            KES {Number(plan.amount_saved).toLocaleString()}
                          </h3>
                        </div>
                      )}

                      {/* BENEFITS */}
                      <div className="space-y-3 pt-5">
                        {(plan.benefits || []).map((benefit, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2 transition-all duration-300 hover:border-emerald-500/20 hover:bg-emerald-500/[0.03]"
                          >
                            {/* PREMIUM TICK */}
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            </div>

                            <span className="text-sm leading-relaxed text-slate-300">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="relative mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                      {/* USERS */}
                      <div>
                        <p className="text-[11px] tracking-[0.2em] text-slate-500 uppercase">
                          Active Users
                        </p>

                        <h4 className="mt-1 text-3xl font-black text-white">
                          {plan.users}
                        </h4>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-2">
                        {/* EDIT */}
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 transition-all hover:scale-105 hover:bg-amber-500/20"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:scale-105 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================
            RENEWALS TAB
        ========================================================= */}

          <TabsContent value="renewals">
            <Card className="rounded-3xl border border-zinc-800 bg-zinc-950">
              <CardContent className="space-y-5 p-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-black p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h4 className="text-lg font-bold">{member.name}</h4>

                      <p className="mt-1 text-sm text-zinc-500">
                        Renewal Date: {member.renewal}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          alert("Renew button clicked");
                        }}
                        className="rounded-2xl border-white/10 bg-black/20"
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Renew
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-2xl border-zinc-800 bg-black"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp Reminder
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
