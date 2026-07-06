"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { motion, AnimatePresence } from "framer-motion";

import {
  CalendarDays,
  CalendarClock,
  CalendarCheck2,
  Search,
  Plus,
  Car,
  User,
  Phone,
  Building2,
  MapPin,
  Clock3,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Pencil,
  Trash2,
  Filter,
  Crown,
  TimerReset,
  ChevronRight,
  BellRing,
  Receipt,
  BadgeCheck,
  ClipboardCheck,
  CarFront,
  Users,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

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

type AppointmentPriority =
  | "normal"
  | "vip"
  | "fleet"
  | "express";

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

  const [authorized, setAuthorized] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [branchId, setBranchId] = useState("");
  const [carwashId, setCarwashId] = useState("");
  const [customerId, setCustomerId] =
    useState<string | null>(null);
  /* =========================================================
     STATE
  ========================================================= */

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [staff, setStaff] = useState<Staff[]>(
    []
  );

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [selectedBranch, setSelectedBranch] =
    useState("all");

  const [loading, setLoading] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<AppointmentForm>(defaultForm);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error" | "">("");

  /* =========================================================
     AUTH CHECK
  ========================================================= */

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

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

  const fetchStaff = useCallback(
    async () => {
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
    },
    [branchId, carwashId]
  );

  const fetchAppointments =
    useCallback(async () => {
      try {
        setPageLoading(true);

        const { data, error } =
          await supabase
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
    if (
      !authorized ||
      !branchId ||
      !carwashId
    )
      return;

    fetchAppointments();
    fetchBranches();
    fetchStaff();

    const appointmentsChannel =
      supabase
        .channel(
          "appointments-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
          },
          () => {
            fetchAppointments();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        appointmentsChannel
      );
    };
  }, [
    authorized,
    fetchAppointments,
    fetchBranches,
    fetchStaff,
  ]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) => {
          const query =
            search.toLowerCase();

          const matchesSearch =
            appointment.customer
              ?.toLowerCase()
              .includes(query) ||
            appointment.phone
              ?.toLowerCase()
              .includes(query) ||
            appointment.vehicle
              ?.toLowerCase()
              .includes(query) ||
            appointment.plate
              ?.toLowerCase()
              .includes(query) ||
            appointment.service
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            activeFilter === "all"
              ? true
              : appointment.status ===
              activeFilter;

          const matchesBranch =
            selectedBranch === "all"
              ? true
              : appointment.branch_id ===
              selectedBranch;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesBranch
          );
        }
      );
    }, [
      appointments,
      search,
      activeFilter,
      selectedBranch,
    ]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: appointments.length,

      confirmed:
        appointments.filter(
          (a) =>
            a.status ===
            "confirmed"
        ).length,

      pending:
        appointments.filter(
          (a) =>
            a.status === "pending"
        ).length,

      washing:
        appointments.filter(
          (a) =>
            a.status === "washing"
        ).length,

      completed:
        appointments.filter(
          (a) =>
            a.status ===
            "completed"
        ).length,

      vip: appointments.filter(
        (a) =>
          a.priority === "vip"
      ).length,
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
              : item
          )
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

      setAppointments((prev) => [
        data[0],
        ...prev,
      ]);

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

  const handleEdit = (
    appointment: Appointment
  ) => {
    setEditingId(appointment.id);

    setForm({
      customer:
        appointment.customer || "",

      phone:
        appointment.phone || "",

      email:
        appointment.email || "",

      vehicle:
        appointment.vehicle || "",

      plate:
        appointment.plate || "",

      vehicle_type:
        appointment.vehicle_type ||
        "Sedan",

      vehicle_color:
        appointment.vehicle_color ||
        "",

      service:
        appointment.service || "",

      appointment_date:
        appointment.appointment_date ||
        "",

      appointment_time:
        appointment.appointment_time ||
        "",

      estimated_duration:
        appointment.estimated_duration ||
        45,

      branch_id:
        appointment.branch_id || "",

      branch_name:
        appointment.branch_name ||
        "",

      assigned_bay:
        appointment.assigned_bay ||
        "",

      assigned_staff:
        appointment.assigned_staff ||
        "",

      priority:
        appointment.priority ||
        "normal",

      notes:
        appointment.notes || "",
    });

    setShowModal(true);
  };


  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (
    id: string
  ) => {
    const confirmDelete =
      window.confirm(
        "Delete this appointment?"
      );

    if (!confirmDelete) return;

    try {
      const { error } =
        await supabase
          .from("appointments")
          .delete()
          .eq("id", id)
          .eq("branch_id", branchId)
          .eq("carwash_id", carwashId);

      if (error) {
        alert(error.message);

        return;
      }

      setAppointments((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus = async (
    id: string,
    status: AppointmentStatus
  ) => {
    try {
      const { error } =
        await supabase
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
            : item
        )
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

  const getStatusColor = (
    status: AppointmentStatus
  ) => {
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

  const getPriorityColor = (
    priority?: AppointmentPriority
  ) => {
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
      <div className="min-h-screen bg-[#020817] flex items-center justify-center text-white">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  /* =========================================================
     PAGE LOADING
  ========================================================= */

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />

          <span>
            Loading appointments...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white p-4 md:p-6 space-y-6">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-5">

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />

            <span className="text-sm text-cyan-300">
              Multi Branch Appointment System
            </span>
          </div>

          <h1 className="mt-5 text-5xl font-black">
            Appointment Management
          </h1>

          <p className="mt-3 text-slate-400 text-lg max-w-3xl">
            Smart booking workflow for multi-branch car wash operations with real-time tracking, scheduling and service management.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="
              h-14
              rounded-2xl
              bg-cyan-500
              hover:bg-cyan-600
              px-7
              text-lg
              font-bold
              shadow-[0_0_35px_rgba(0,255,255,0.25)]
            "
          >
            <Plus className="mr-2 h-5 w-5" />
            New Appointment
          </Button>

        </div>
      </div>

      {/* =========================================================
    STATS
========================================================= */}

      <Card className="bg-[#0B1220] border border-white/10 rounded-[2rem]">
        <CardContent className="p-5">

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-5">

            {[
              {
                title: "Total",
                value: stats.total,
                icon: CalendarDays,
              },
              {
                title: "Confirmed",
                value: stats.confirmed,
                icon: CheckCircle2,
              },
              {
                title: "Pending",
                value: stats.pending,
                icon: AlertTriangle,
              },
              {
                title: "Washing",
                value: stats.washing,
                icon: Sparkles,
              },
              {
                title: "Completed",
                value: stats.completed,
                icon: ClipboardCheck,
              },
              {
                title: "VIP",
                value: stats.vip,
                icon: Crown,
              },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="
              flex
              items-center
              gap-3
              rounded-2xl
              p-3
              hover:bg-white/5
              transition-all
            "
                >
                  <div
                    className="
                h-10
                w-10
                flex
                items-center
                justify-center
                rounded-xl
                bg-cyan-500/10
                border
                border-cyan-500/20
              "
                  >
                    <Icon className="h-4 w-4 text-cyan-400" />
                  </div>

                  <div>
                    <div
                      className={`text-3xl font-black ${getKpiColor(card.title)}`}
                    >
                      {card.value}
                    </div>

                    <div className="text-xs text-slate-400">
                      {card.title}
                    </div>
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

      <div className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">

        <div className="flex flex-col 2xl:flex-row gap-4">

          <div className="relative flex-1">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

            <Input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search customer, plate, service, phone..."
              className="h-14 rounded-2xl border-white/10 bg-[#020817] pl-12 text-white"
            />
          </div>

          <div className="flex flex-wrap gap-3">

            <select
              value={selectedBranch}
              onChange={(e) =>
                setSelectedBranch(
                  e.target.value
                )
              }
              className="
                h-14
                rounded-2xl
                border border-white/10
                bg-[#020817]
                px-5
                text-white
                outline-none
              "
            >
              <option value="all">
                All Branches
              </option>

              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              ))}
            </select>

            {[
              "all",
              "pending",
              "confirmed",
              "arrived",
              "washing",
              "completed",
            ].map((status) => (
              <button
                key={status}
                onClick={() =>
                  setActiveFilter(
                    status
                  )
                }
                className={`
                  h-14
                  rounded-2xl
                  px-5
                  text-sm
                  font-semibold
                  capitalize
                  transition-all

                  ${activeFilter ===
                    status
                    ? "bg-cyan-500 text-white"
                    : "bg-[#020817] text-slate-400 hover:bg-cyan-500/10"
                  }
                `}
              >
                {status}
              </button>
            ))}

          </div>

        </div>

      </div>

      {/* =========================================================
          APPOINTMENTS GRID
      ========================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {filteredAppointments.map(
          (appointment) => (
            <motion.div
              key={appointment.id}
              whileHover={{
                y: -4,
              }}
            >
              <Card
                className="
                  overflow-hidden
                  rounded-[2rem]
                  border border-white/10
                  bg-[#0B1220]
                  text-white
                  transition-all
                  duration-300
                  hover:border-cyan-500/30
                  hover:shadow-[0_0_35px_rgba(0,255,255,0.15)]
                "
              >
                <CardContent className="p-7">

                  {/* TOP */}

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                    <div className="flex items-start gap-4">

                      <div
                        className="
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center
                          rounded-3xl
                          bg-cyan-500/10
                          border
                          border-cyan-500/20
                        "
                      >
                        <CalendarCheck2 className="h-7 w-7 text-cyan-400" />
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="text-2xl font-black">
                            {
                              appointment.customer
                            }
                          </h2>

                          <Badge
                            className={`
                              border
                              ${getStatusColor(
                              appointment.status
                            )}
                            `}
                          >
                            {
                              appointment.status
                            }
                          </Badge>

                          <Badge
                            className={`
                              ${getPriorityColor(
                              appointment.priority
                            )}
                            `}
                          >
                            {appointment.priority ||
                              "normal"}
                          </Badge>

                        </div>

                        <p className="mt-2 text-cyan-300 font-medium">
                          {
                            appointment.service
                          }
                        </p>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <Button
                        size="icon"
                        onClick={() =>
                          handleEdit(
                            appointment
                          )
                        }
                        className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        onClick={() =>
                          updateStatus(
                            appointment.id,
                            "confirmed"
                          )
                        }
                        className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20"
                      >
                        <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                      </Button>

                      <Button
                        size="icon"
                        onClick={() =>
                          updateStatus(
                            appointment.id,
                            "completed"
                          )
                        }
                        className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <BadgeCheck className="h-4 w-4 text-emerald-300" />
                      </Button>

                      <Button
                        size="icon"
                        onClick={() =>
                          updateStatus(
                            appointment.id,
                            "cancelled"
                          )
                        }
                        className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                      >
                        <XCircle className="h-4 w-4 text-amber-300" />
                      </Button>

                      <Button
                        size="icon"
                        onClick={() =>
                          handleDelete(
                            appointment.id
                          )
                        }
                        className="h-11 w-11 rounded-2xl bg-red-500/10 border border-red-500/20"
                      >
                        <Trash2 className="h-4 w-4 text-red-300" />
                      </Button>

                    </div>

                  </div>

                  {/* DIVIDER */}

                  <div className="my-6 border-t border-white/10" />

                  {/* INFO GRID */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                      value={
                        appointment.branch_name ||
                        "No Branch"
                      }
                    />

                    <InfoCard
                      icon={Users}
                      title="Assigned Staff"
                      value={
                        appointment.assigned_staff ||
                        "Unassigned"
                      }
                    />

                    <InfoCard
                      icon={Wand2}
                      title="Bay"
                      value={
                        appointment.assigned_bay ||
                        "No Bay"
                      }
                    />

                  </div>

                  {/* NOTES */}

                  {appointment.notes && (
                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Notes
                      </p>

                      <p className="mt-3 text-slate-300">
                        {
                          appointment.notes
                        }
                      </p>
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          )
        )}

      </div>

      {/* =========================================================
          EMPTY STATE
      ========================================================= */}

      {filteredAppointments.length ===
        0 && (
          <div
            className="
            rounded-[2rem]
            border border-white/10
            bg-[#0B1220]
            p-14
            text-center
          "
          >
            <CalendarDays className="mx-auto h-14 w-14 text-cyan-400" />

            <h2 className="mt-5 text-3xl font-black">
              No Appointments Found
            </h2>

            <p className="mt-3 text-slate-400">
              Create your first appointment to start managing customer bookings.
            </p>
          </div>
        )}

      {/* =========================================================
          MODAL
      ========================================================= */}

      <AnimatePresence>

        {showModal && (

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="
              fixed
              inset-0
              z-50
              bg-black/70
              backdrop-blur-sm
              flex
              items-center
              justify-center
              p-4
            "
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
              className="
                w-full
                max-w-4xl
                rounded-[2rem]
                border
                border-white/10
                bg-[#081120]
                p-8
                max-h-[95vh]
                overflow-y-auto
              "
            >

              {/* HEADER */}

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h2 className="text-4xl font-black">
                    {editingId
                      ? "Edit Appointment"
                      : "Create Appointment"}
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
                  className="
                    h-12
                    w-12
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/5
                    flex
                    items-center
                    justify-center
                  "
                >
                  ✕
                </button>

              </div>

              {/* FORM */}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">

                <Input
                  placeholder="Customer Name"
                  value={form.customer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customer:
                        e.target.value,
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
                      phone:
                        e.target.value,
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
                      email:
                        e.target.value,
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
                      vehicle:
                        e.target.value,
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
                      plate:
                        e.target.value.toUpperCase(),
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
                      vehicle_color:
                        e.target.value,
                    })
                  }
                  className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                />

                <select
                  value={
                    form.vehicle_type
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vehicle_type:
                        e.target.value,
                    })
                  }
                  className="
                    h-14
                    rounded-2xl
                    border border-white/10
                    bg-[#0B1220]
                    px-4
                    text-white
                  "
                >
                  <option>
                    Sedan
                  </option>

                  <option>
                    SUV
                  </option>

                  <option>
                    Pickup
                  </option>

                  <option>
                    Truck
                  </option>

                  <option>
                    Van
                  </option>

                  <option>
                    Motorcycle
                  </option>
                </select>

                <Input
                  placeholder="Service"
                  value={form.service}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      service:
                        e.target.value,
                    })
                  }
                  className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                />

                <Input
                  type="date"
                  value={
                    form.appointment_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      appointment_date:
                        e.target.value,
                    })
                  }
                  className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                />

                <Input
                  type="time"
                  value={
                    form.appointment_time
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      appointment_time:
                        e.target.value,
                    })
                  }
                  className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                />

                <Input
                  type="number"
                  placeholder="Estimated Duration"
                  value={
                    form.estimated_duration
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimated_duration:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                />

                <select
                  value={form.branch_id}
                  onChange={(e) => {
                    const branch =
                      branches.find(
                        (b) =>
                          b.id ===
                          e.target.value
                      );

                    setForm({
                      ...form,
                      branch_id:
                        e.target.value,

                      branch_name:
                        branch?.name ||
                        "",
                    });
                  }}
                  className="
                    h-14
                    rounded-2xl
                    border border-white/10
                    bg-[#0B1220]
                    px-4
                    text-white
                  "
                >

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    form.assigned_staff
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assigned_staff:
                        e.target.value,
                    })
                  }
                  className="
                    h-14
                    rounded-2xl
                    border border-white/10
                    bg-[#0B1220]
                    px-4
                    text-white
                  "
                >
                  <option value="">
                    Assign Staff
                  </option>

                  {staff.map(
                    (member) => (
                      <option
                        key={member.id}
                        value={
                          member.name
                        }
                      >
                        {member.name}
                      </option>
                    )
                  )}
                </select>

                <Input
                  placeholder="Assigned Bay"
                  value={
                    form.assigned_bay
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assigned_bay:
                        e.target.value,
                    })
                  }
                  className="h-14 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                />

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority:
                        e.target
                          .value as AppointmentPriority,
                    })
                  }
                  className="
                    h-14
                    rounded-2xl
                    border border-white/10
                    bg-[#0B1220]
                    px-4
                    text-white
                  "
                >
                  <option value="normal">
                    Normal
                  </option>

                  <option value="vip">
                    VIP
                  </option>

                  <option value="fleet">
                    Fleet
                  </option>

                  <option value="express">
                    Express
                  </option>
                </select>

              </div>

              {/* NOTES */}

              <textarea
                placeholder="Appointment Notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes:
                      e.target.value,
                  })
                }
                className="
                  mt-5
                  min-h-[140px]
                  w-full
                  rounded-[2rem]
                  border
                  border-white/10
                  bg-[#0B1220]
                  p-5
                  text-white
                  outline-none
                "
              />

              {/* MESSAGE */}

              {message && (
                <div
                  className={`
                    mt-5
                    rounded-2xl
                    border
                    p-4
                    flex
                    items-start
                    gap-3

                    ${messageType ===
                      "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/20 bg-red-500/10 text-red-300"
                    }
                  `}
                >

                  {messageType ===
                    "success" ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                  )}

                  <span>
                    {message}
                  </span>

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
                  onClick={
                    handleSaveAppointment
                  }
                  disabled={loading}
                  className="
                    h-14
                    rounded-2xl
                    bg-cyan-500
                    hover:bg-cyan-600
                    px-7
                    text-white
                    font-bold
                  "
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

        )}

      </AnimatePresence>

    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon: Icon,
  title,
  value,
}: any) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-white/10
        bg-black/20
        p-4
      "
    >

      <div className="flex items-center gap-3">

        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-cyan-500/10
            border
            border-cyan-500/20
          "
        >
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>

        <div>

          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {title}
          </p>

          <h4 className="mt-1 font-semibold text-white">
            {value}
          </h4>

        </div>

      </div>

    </div>
  );
}