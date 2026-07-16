"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { motion, AnimatePresence } from "framer-motion";

import {
  CalendarDays,
  CalendarClock,
  CalendarCheck2,
  RefreshCw,
  Search,
  Plus,
  RotateCcw,
  Building2,
  ChevronDown,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Pencil,
  Trash2,
  Crown,
  BadgeCheck,
  ClipboardCheck,
  CarFront,
  Users,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Card, CardContent } from "@/components/ui/card";

/* =========================================================
   TYPES
========================================================= */

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "washing"
  | "completed"
  | "cancelled"
  | "no_show";

type AppointmentPriority = "normal" | "vip" | "fleet" | "express";

type Appointment = {
  id: string;

  branch_id?: string;
  branch_name?: string;

  carwash_id?: string;
  carwash_name?: string;

  customer_id?: string;

  customer: string;
  phone: string;
  email?: string;

  vehicle: string;
  plate: string;
  vehicle_type?: string;
  vehicle_color?: string;

  service: string;

  appointment_date: string;
  appointment_time: string;

  estimated_duration?: number;

  assigned_bay?: string;
  assigned_staff?: string;

  status: AppointmentStatus;

  priority?: AppointmentPriority;

  notes?: string;

  total_amount?: number;

  payment_status?: string;

  created_at?: string;
};

type AppointmentForm = {
  customer: string;
  phone: string;
  email: string;

  vehicle: string;
  plate: string;

  vehicle_type: string;
  vehicle_color: string;

  service: string;

  appointment_date: string;
  appointment_time: string;

  estimated_duration: number;

  branch_id: string;
  branch_name: string;

  assigned_bay: string;
  assigned_staff: string;

  priority: AppointmentPriority;

  notes: string;
};

type Branch = {
  id: string;
  name: string;
};

type Staff = {
  id: string;
  name: string;
};

/* =========================================================
   DEFAULT FORM
========================================================= */

const defaultForm: AppointmentForm = {
  customer: "",
  phone: "",
  email: "",

  vehicle: "",
  plate: "",

  vehicle_type: "Sedan",
  vehicle_color: "",

  service: "",

  appointment_date: "",
  appointment_time: "",

  estimated_duration: 45,

  branch_id: "",
  branch_name: "",

  assigned_bay: "",
  assigned_staff: "",

  priority: "normal",

  notes: "",
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AppointmentsPage() {
  const router = useRouter();

  /* =========================================================
     AUTH
  ========================================================= */

  const [authorized, setAuthorized] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);

  const [branchId, setBranchId] = useState("");
  const [carwashId, setCarwashId] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  /* =========================================================
     STATE
  ========================================================= */

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [staff, setStaff] = useState<Staff[]>([]);

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");

  const [selectedBranch, setSelectedBranch] = useState("all");

  const [loading, setLoading] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<AppointmentForm>(defaultForm);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  /* =========================================================
     AUTH CHECK
  ========================================================= */

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/auth");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("branch_id, carwash_id")
          .eq("id", session.user.id)
          .single();

        setBranchId(profile?.branch_id || "");
        setCarwashId(profile?.carwash_id || "");

        setAuthorized(true);
      } catch (error) {
        console.error(error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const fetchBranches = useCallback(async () => {
    if (!carwashId) return;

    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("carwash_id", carwashId)
      .order("name", { ascending: true });

    if (error) {
      console.error("BRANCH ERROR:", error);
      return;
    }

    setBranches(data || []);
  }, [carwashId]);

  const fetchStaff = useCallback(async () => {
    if (!branchId || !carwashId) return;

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("branch_id", branchId)
      .eq("carwash_id", carwashId)
      .order("name", { ascending: true });

    if (error) {
      console.error("STAFF ERROR:", error);
      return;
    }

    setStaff(data || []);
  }, [branchId, carwashId]);

  const fetchAppointments = useCallback(async () => {
    try {
      setPageLoading(true);

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("carwash_id", carwashId)
        .eq("branch_id", branchId)
        .order("appointment_date", {
          ascending: true,
        });

      if (error) {
        console.error("FETCH ERROR:", error);
        return;
      }

      setAppointments(data || []);
    } finally {
      setPageLoading(false);
    }
  }, [branchId, carwashId]);

  useEffect(() => {
    if (!authorized || !branchId || !carwashId) return;

    fetchAppointments();
    fetchBranches();
    fetchStaff();

    const appointmentsChannel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          fetchAppointments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
    };
  }, [authorized, fetchAppointments, fetchBranches, fetchStaff]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const query = search.toLowerCase();

      const matchesSearch =
        appointment.customer?.toLowerCase().includes(query) ||
        appointment.phone?.toLowerCase().includes(query) ||
        appointment.vehicle?.toLowerCase().includes(query) ||
        appointment.plate?.toLowerCase().includes(query) ||
        appointment.service?.toLowerCase().includes(query);

      const matchesStatus =
        activeFilter === "all" ? true : appointment.status === activeFilter;

      const matchesBranch =
        selectedBranch === "all"
          ? true
          : appointment.branch_id === selectedBranch;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [appointments, search, activeFilter, selectedBranch]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: appointments.length,

      confirmed: appointments.filter((a) => a.status === "confirmed").length,

      pending: appointments.filter((a) => a.status === "pending").length,

      washing: appointments.filter((a) => a.status === "washing").length,

      completed: appointments.filter((a) => a.status === "completed").length,

      vip: appointments.filter((a) => a.priority === "vip").length,
    };
  }, [appointments]);

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setForm(defaultForm);

    setEditingId(null);

    setMessage("");

    setMessageType("");
  };

  /* =========================================================
     SAVE APPOINTMENT
  ========================================================= */

  const handleSaveAppointment = async () => {
    try {
      if (
        !form.customer ||
        !form.phone ||
        !form.vehicle ||
        !form.plate ||
        !form.service ||
        !form.appointment_date ||
        !form.appointment_time
      ) {
        setMessageType("error");
        setMessage("Fill all required fields");
        return;
      }

      setLoading(true);

      const payload = {
        customer: form.customer,
        phone: form.phone,
        email: form.email || null,
        vehicle: form.vehicle,
        plate: form.plate.toUpperCase(),
        vehicle_type: form.vehicle_type,
        vehicle_color: form.vehicle_color,
        service: form.service,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        estimated_duration: form.estimated_duration,
        branch_id: branchId,
        carwash_id: carwashId,
        branch_name: form.branch_name || null,
        assigned_bay: form.assigned_bay || null,
        assigned_staff: form.assigned_staff || null,
        priority: form.priority,
        notes: form.notes || null,
      };

      // UPDATE
      if (editingId) {
        const { error } = await supabase
          .from("appointments")
          .update(payload)
          .eq("id", editingId)
          .eq("branch_id", branchId)
          .eq("carwash_id", carwashId);

        if (error) {
          setMessageType("error");
          setMessage(error.message);
          return;
        }

        setAppointments((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? ({
                  ...item,
                  ...payload,
                } as Appointment)
              : item,
          ),
        );

        setMessageType("success");
        setMessage("Appointment updated successfully");

        setTimeout(() => {
          setShowModal(false);
          resetForm();
        }, 1000);

        return;
      }

      // CREATE
      const { data, error } = await supabase
        .from("appointments")
        .insert([
          {
            ...payload,
            status: "pending",
          },
        ])
        .select();

      if (error) {
        setMessageType("error");
        setMessage(error.message);
        return;
      }

      if (!data?.length) {
        setMessageType("error");
        setMessage("Appointment was not returned after insert.");
        return;
      }

      setAppointments((prev) => [data[0], ...prev]);

      setMessageType("success");
      setMessage("Appointment created successfully");

      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1000);
    } catch (error: any) {
      console.error(error);
      setMessageType("error");
      setMessage(error?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (appointment: Appointment) => {
    setEditingId(appointment.id);

    setForm({
      customer: appointment.customer || "",

      phone: appointment.phone || "",

      email: appointment.email || "",

      vehicle: appointment.vehicle || "",

      plate: appointment.plate || "",

      vehicle_type: appointment.vehicle_type || "Sedan",

      vehicle_color: appointment.vehicle_color || "",

      service: appointment.service || "",

      appointment_date: appointment.appointment_date || "",

      appointment_time: appointment.appointment_time || "",

      estimated_duration: appointment.estimated_duration || 45,

      branch_id: appointment.branch_id || "",

      branch_name: appointment.branch_name || "",

      assigned_bay: appointment.assigned_bay || "",

      assigned_staff: appointment.assigned_staff || "",

      priority: appointment.priority || "normal",

      notes: appointment.notes || "",
    });

    setShowModal(true);
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Delete this appointment?");

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("branch_id", branchId)
        .eq("carwash_id", carwashId);

      if (error) {
        alert(error.message);

        return;
      }

      setAppointments((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status,
        })
        .eq("id", id)
        .eq("branch_id", branchId)
        .eq("carwash_id", carwashId);

      if (error) {
        alert(error.message);

        return;
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================================================
   KPI COLORS
========================================================= */

  const getKpiColor = (title: string) => {
    switch (title) {
      case "Pending":
        return "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]";

      case "Confirmed":
        return "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]";

      case "Completed":
        return "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]";

      case "Washing":
        return "text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]";

      case "VIP":
        return "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]";

      default:
        return "text-white";
    }
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";

      case "completed":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";

      case "washing":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";

      case "cancelled":
        return "bg-red-500/10 text-red-300 border-red-500/20";

      case "arrived":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";

      default:
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    }
  };

  const getPriorityColor = (priority?: AppointmentPriority) => {
    switch (priority) {
      case "vip":
        return "bg-yellow-500 text-black";

      case "fleet":
        return "bg-purple-500 text-white";

      case "express":
        return "bg-cyan-500 text-white";

      default:
        return "bg-slate-700 text-white";
    }
  };

  /* =========================================================
     AUTH LOADING
  ========================================================= */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  /* =========================================================
     PAGE LOADING
  ========================================================= */

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />

          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#020817] p-4 text-white md:p-6">
      {/* =========================================================
    HEADER
========================================================= */}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}

        <div className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />

            <span className="text-[10px] font-bold tracking-[0.25em] text-cyan-300 uppercase">
              Appointment Center
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Appointment Management
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Manage bookings, schedules, washing progress and customer visits
              across every branch.
            </p>
          </div>

          {/* Quick Status */}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">
                Live Scheduling
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">
                Multi Branch
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-purple-500/15 bg-purple-500/5 px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-300">
                Real-time Tracking
              </span>
            </div>
          </div>
        </div>

        {/* Right */}

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-slate-700 bg-slate-900/60 px-5 text-slate-300 hover:border-cyan-500 hover:bg-slate-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="h-11 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 font-bold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* =========================================================
    KPI STATS
========================================================= */}

      <Card className="mb-5 overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-r from-[#061225] via-[#08152A] to-[#061225] shadow-lg shadow-black/20">
        <CardContent className="p-2.5">
          <div className="grid grid-cols-6 gap-2">
            {[
              {
                title: "Total",
                value: stats.total,
                icon: CalendarDays,
                color: {
                  bg: "bg-cyan-500/10",
                  border: "border-cyan-500/20",
                  icon: "text-cyan-400",
                  value: "text-cyan-300",
                },
              },
              {
                title: "Confirmed",
                value: stats.confirmed,
                icon: CheckCircle2,
                color: {
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                  icon: "text-emerald-400",
                  value: "text-emerald-300",
                },
              },
              {
                title: "Pending",
                value: stats.pending,
                icon: AlertTriangle,
                color: {
                  bg: "bg-amber-500/10",
                  border: "border-amber-500/20",
                  icon: "text-amber-400",
                  value: "text-amber-300",
                },
              },
              {
                title: "Washing",
                value: stats.washing,
                icon: Sparkles,
                color: {
                  bg: "bg-sky-500/10",
                  border: "border-sky-500/20",
                  icon: "text-sky-400",
                  value: "text-sky-300",
                },
              },
              {
                title: "Completed",
                value: stats.completed,
                icon: ClipboardCheck,
                color: {
                  bg: "bg-violet-500/10",
                  border: "border-violet-500/20",
                  icon: "text-violet-400",
                  value: "text-violet-300",
                },
              },
              {
                title: "VIP",
                value: stats.vip,
                icon: Crown,
                color: {
                  bg: "bg-rose-500/10",
                  border: "border-rose-500/20",
                  icon: "text-rose-400",
                  value: "text-rose-300",
                },
              },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className={`group rounded-2xl border ${card.color.border} ${card.color.bg} p-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#091B2D] ${card.color.icon}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <h3
                      className={`text-base leading-none font-black ${card.color.value}`}
                    >
                      {card.value}
                    </h3>

                    <p className="mt-1 truncate text-[9px] font-semibold tracking-wider text-slate-500 uppercase">
                      {card.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* =========================================================
    FILTERS
========================================================= */}

      <div className="mb-5 rounded-[28px] border border-cyan-500/10 bg-gradient-to-br from-[#081422] via-[#0A1628] to-[#07121F] p-4 shadow-lg shadow-black/30">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          {/* Search */}

          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-cyan-400" />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, plate, phone or service..."
              className="h-11 rounded-2xl border border-cyan-500/10 bg-slate-950/70 pr-4 pl-11 text-sm text-white transition-all placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Right Controls */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Branch */}

            <div className="relative">
              <Building2 className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-cyan-400" />

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="h-11 min-w-[180px] appearance-none rounded-2xl border border-cyan-500/10 bg-slate-950/70 pr-10 pl-11 text-sm font-medium text-white transition-all outline-none hover:border-cyan-500/30 focus:border-cyan-500"
              >
                <option value="all">All Branches</option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Status Pills */}

        <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1">
          {[
            {
              id: "all",
              label: "All",
              color: "bg-slate-700/40 text-slate-300 border-slate-600",
            },
            {
              id: "pending",
              label: "Pending",
              color: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
            },
            {
              id: "confirmed",
              label: "Confirmed",
              color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
            },
            {
              id: "arrived",
              label: "Arrived",
              color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
            },
            {
              id: "washing",
              label: "Washing",
              color: "bg-purple-500/10 text-purple-300 border-purple-500/20",
            },
            {
              id: "completed",
              label: "Completed",
              color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
            },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setActiveFilter(status.id)}
              className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                activeFilter === status.id
                  ? "border-cyan-500 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : `${status.color} hover:-translate-y-0.5 hover:border-cyan-500/40`
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          APPOINTMENTS GRID
      ========================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {filteredAppointments.map((appointment) => (
          <motion.div
            key={appointment.id}
            whileHover={{
              y: -4,
            }}
          >
            <Card className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1220] text-white transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_35px_rgba(0,255,255,0.15)]">
              <CardContent className="p-7">
                {/* TOP */}

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10">
                      <CalendarCheck2 className="h-7 w-7 text-cyan-400" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black">
                          {appointment.customer}
                        </h2>

                        <Badge
                          className={`border ${getStatusColor(
                            appointment.status,
                          )} `}
                        >
                          {appointment.status}
                        </Badge>

                        <Badge
                          className={` ${getPriorityColor(
                            appointment.priority,
                          )} `}
                        >
                          {appointment.priority || "normal"}
                        </Badge>
                      </div>

                      <p className="mt-2 font-medium text-cyan-300">
                        {appointment.service}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="icon"
                      onClick={() => handleEdit(appointment)}
                      className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      onClick={() => updateStatus(appointment.id, "confirmed")}
                      className="h-11 w-11 rounded-2xl border border-cyan-500/20 bg-cyan-500/10"
                    >
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                    </Button>

                    <Button
                      size="icon"
                      onClick={() => updateStatus(appointment.id, "completed")}
                      className="h-11 w-11 rounded-2xl border border-emerald-500/20 bg-emerald-500/10"
                    >
                      <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    </Button>

                    <Button
                      size="icon"
                      onClick={() => updateStatus(appointment.id, "cancelled")}
                      className="h-11 w-11 rounded-2xl border border-amber-500/20 bg-amber-500/10"
                    >
                      <XCircle className="h-4 w-4 text-amber-300" />
                    </Button>

                    <Button
                      size="icon"
                      onClick={() => handleDelete(appointment.id)}
                      className="h-11 w-11 rounded-2xl border border-red-500/20 bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 text-red-300" />
                    </Button>
                  </div>
                </div>

                {/* DIVIDER */}

                <div className="my-6 border-t border-white/10" />

                {/* INFO GRID */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={CarFront}
                    title="Vehicle"
                    value={`${appointment.vehicle} • ${appointment.plate}`}
                  />

                  <InfoCard
                    icon={Phone}
                    title="Phone"
                    value={appointment.phone}
                  />

                  <InfoCard
                    icon={CalendarClock}
                    title="Schedule"
                    value={`${appointment.appointment_date} • ${appointment.appointment_time}`}
                  />

                  <InfoCard
                    icon={MapPin}
                    title="Branch"
                    value={appointment.branch_name || "No Branch"}
                  />

                  <InfoCard
                    icon={Users}
                    title="Assigned Staff"
                    value={appointment.assigned_staff || "Unassigned"}
                  />

                  <InfoCard
                    icon={Wand2}
                    title="Bay"
                    value={appointment.assigned_bay || "No Bay"}
                  />
                </div>

                {/* NOTES */}

                {appointment.notes && (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                      Notes
                    </p>

                    <p className="mt-3 text-slate-300">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* =========================================================
    EMPTY STATE
========================================================= */}

      {filteredAppointments.length === 0 && (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-cyan-500/15 bg-gradient-to-br from-[#07111F] via-[#08192D] to-[#06101D] p-6 shadow-[0_15px_50px_rgba(0,0,0,.35)]">
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Icon */}
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10 shadow-lg shadow-cyan-500/10">
                <CalendarDays className="h-10 w-10 text-cyan-400" />
              </div>

              {/* Title */}
              <h2 className="mt-5 text-2xl font-black tracking-tight text-white">
                No Appointments Found
              </h2>

              {/* Description */}
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                There are no appointments matching your current filters. Create
                a new booking or adjust your search to view appointments.
              </p>

              {/* Buttons */}
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                    setSelectedBranch("all");
                  }}
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-700 bg-slate-900/60 px-5 text-slate-300 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-300"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>

                <Button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="h-11 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Appointment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL
      ========================================================= */}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{
                opacity: 0,
                y: -40,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -30,
                scale: 0.98,
              }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className="w-full max-w-6xl overflow-hidden rounded-[30px] border border-cyan-500/10 bg-gradient-to-b from-[#091426] via-[#081321] to-[#06101D] shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
            >
              <motion.div
                initial={{
                  scale: 0.9,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0.9,
                  opacity: 0,
                }}
                className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081120] p-8"
              >
                {/* HEADER */}

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-black">
                      {editingId ? "Edit Appointment" : "Create Appointment"}
                    </h2>

                    <p className="mt-2 text-slate-400">
                      Multi branch booking and scheduling management
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowModal(false);

                      resetForm();
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
                  >
                    ✕
                  </button>
                </div>

                {/* FORM */}

                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Input
                    placeholder="Customer Name"
                    value={form.customer}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        customer: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    placeholder="Vehicle"
                    value={form.vehicle}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        vehicle: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    placeholder="Plate Number"
                    value={form.plate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        plate: e.target.value.toUpperCase(),
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    placeholder="Vehicle Color"
                    value={form.vehicle_color}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        vehicle_color: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <select
                    value={form.vehicle_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        vehicle_type: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white"
                  >
                    <option>Sedan</option>

                    <option>SUV</option>

                    <option>Pickup</option>

                    <option>Truck</option>

                    <option>Van</option>

                    <option>Motorcycle</option>
                  </select>

                  <Input
                    placeholder="Service"
                    value={form.service}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        service: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        appointment_date: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    type="time"
                    value={form.appointment_time}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        appointment_time: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <Input
                    type="number"
                    placeholder="Estimated Duration"
                    value={form.estimated_duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimated_duration: Number(e.target.value),
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <select
                    value={form.branch_id}
                    onChange={(e) => {
                      const branch = branches.find(
                        (b) => b.id === e.target.value,
                      );

                      setForm({
                        ...form,
                        branch_id: e.target.value,

                        branch_name: branch?.name || "",
                      });
                    }}
                    className="h-14 rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white"
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={form.assigned_staff}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assigned_staff: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white"
                  >
                    <option value="">Assign Staff</option>

                    {staff.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>

                  <Input
                    placeholder="Assigned Bay"
                    value={form.assigned_bay}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assigned_bay: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                  />

                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as AppointmentPriority,
                      })
                    }
                    className="h-14 rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white"
                  >
                    <option value="normal">Normal</option>

                    <option value="vip">VIP</option>

                    <option value="fleet">Fleet</option>

                    <option value="express">Express</option>
                  </select>
                </div>

                {/* NOTES */}

                <textarea
                  placeholder="Appointment Notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  className="mt-5 min-h-[140px] w-full rounded-[2rem] border border-white/10 bg-[#0B1220] p-5 text-white outline-none"
                />

                {/* MESSAGE */}

                {message && (
                  <div
                    className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${
                      messageType === "success"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/20 bg-red-500/10 text-red-300"
                    } `}
                  >
                    {messageType === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5" />
                    )}

                    <span>{message}</span>
                  </div>
                )}

                {/* ACTIONS */}

                <div className="mt-7 flex flex-wrap justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);

                      resetForm();
                    }}
                    className="h-14 rounded-2xl border-white/10 bg-transparent text-white"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleSaveAppointment}
                    disabled={loading}
                    className="h-14 rounded-2xl bg-cyan-500 px-7 font-bold text-white hover:bg-cyan-600"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </div>
                    ) : editingId ? (
                      "Update Appointment"
                    ) : (
                      "Create Appointment"
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({ icon: Icon, title, value }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>

        <div>
          <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
            {title}
          </p>

          <h4 className="mt-1 font-semibold text-white">{value}</h4>
        </div>
      </div>
    </div>
  );
}
