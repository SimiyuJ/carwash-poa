"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

import {
  Clock3,
  Car,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Search,
  BellRing,
  Users,
  TimerReset,
  Crown,
  ChevronRight,
  Loader2,
  Building2,
  CreditCard,
  Activity,
  MapPin,
  GaugeCircle,
  AlertTriangle,
  Check,
  Waves,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type QueueStatus =
  | "waiting"
  | "washing"
  | "detailing"
  | "quality"
  | "completed";

type QueuePriority = "VIP" | "Express" | "Fleet" | "Normal";

type QueueVehicle = {
  id: string | number;

  carwash_id: string;

  branch_id: string;

  customer_id?: string;

  vehicle_id?: string;

  ticket: string;

  plate: string;

  customer: string;

  vehicle: string;

  service: string;

  bay?: string;

  assigned_staff?: string;

  staff?: string;

  eta?: string;

  check_in: string;

  priority?: QueuePriority;

  payment: "Paid" | "Pending";

  status: QueueStatus;

  branch_name?: string;

  created_at?: string;

  invoices?: {
    id: string;

    payment_status: string;

    payment_method?: string;

    paid_at?: string;
  } | null;
};

type Staff = {
  id: string;

  name: string;

  role?: string;

  branch_id?: string;

  status?: string;
};

type Branch = {
  id: string;
  name: string;
};

type Bay = {
  id: string;

  name: string;

  branch_id: string;

  status?: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function QueuePage() {
  /* =========================================================
     STATES
  ========================================================= */

  const [vehicles, setVehicles] = useState<QueueVehicle[]>([]);

  const [staff, setStaff] = useState<Staff[]>([]);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [bays, setBays] = useState<Bay[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("all");

  const [selectedPriority, setSelectedPriority] = useState("all");

  const [selectedBay, setSelectedBay] = useState("all");

  const [assigningVehicle, setAssigningVehicle] = useState<QueueVehicle | null>(
    null,
  );

  const [movingVehicleId, setMovingVehicleId] = useState<
    string | number | null
  >(null);

  const [staffName, setStaffName] = useState("");

  const [bayName, setBayName] = useState("");

  const [assignLoading, setAssignLoading] = useState(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      /* =========================================================
         PROFILE
      ========================================================= */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error(profileError);
        return;
      }

      const carwashId = profile.carwash_id;
      const branchId = profile.branch_id;
      const { data: bayData, error: bayError } = await supabase
        .from("wash_bays")
        .select("*")
        .order("name");

      setBays(bayData || []);

      /* =========================================================
         BRANCHES
      ========================================================= */

      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("carwash_id", carwashId)
        .order("name");

      setBranches(branchData || []);

      /* =========================================================
         STAFF
      ========================================================= */

      let staffQuery = supabase
        .from("staff")
        .select("*")
        .eq("carwash_id", carwashId);

      if (profile.role !== "admin") {
        staffQuery = staffQuery.eq("branch_id", branchId);
      }

      const { data: staffData, error: staffError } = await staffQuery;

      setStaff(
        (staffData || []).map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          branch_id: s.branch_id,
        })),
      );

      /* =========================================================
         QUEUE
      ========================================================= */

      let query = supabase
        .from("queue_vehicles")
        .select(
          `
          *,
          invoices:invoice_id (
          id,
          payment_status,
          payment_method,
          paid_at
          )
          `,
        )
        .eq("carwash_id", carwashId);

      query = query.order("created_at", {
        ascending: true,
      });

      if (selectedBranch !== "all") {
        query = query.eq("branch_id", selectedBranch);
      }

      const { data } = await query;

      const formatted =
        data?.map((item: any) => ({
          ...item,

          check_in: item.check_in || item.checkin,

          assigned_staff: item.assigned_staff || item.staff || "",

          bay: item.bay || "",

          eta: item.eta || "Pending",
        })) || [];

      setVehicles(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================================================
     REALTIME
  ========================================================= */

  useEffect(() => {
    const channel = supabase
      .channel("queue-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_vehicles",
        },
        (payload) => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  /* =========================================================
     FILTERED VEHICLES
  ========================================================= */

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.plate?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.customer?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.vehicle?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.ticket?.toLowerCase().includes(search.toLowerCase());

      const matchesPriority =
        selectedPriority === "all" || vehicle.priority === selectedPriority;

      const matchesBay = selectedBay === "all" || vehicle.bay === selectedBay;

      return matchesSearch && matchesPriority && matchesBay;
    });
  }, [vehicles, search, selectedPriority, selectedBay]);

  /* =========================================================
     QUEUE STATS
  ========================================================= */

  const queueStats = useMemo(() => {
    return {
      total: vehicles.length,

      waiting: vehicles.filter((v) => v.status === "waiting").length,

      washing: vehicles.filter((v) => v.status === "washing").length,

      completed: vehicles.filter((v) => v.status === "completed").length,

      vip: vehicles.filter((v) => v.priority === "VIP").length,

      express: vehicles.filter((v) => v.priority === "Express").length,
    };
  }, [vehicles]);

  /* =========================================================
     MOVE VEHICLE
  ========================================================= */

  const moveVehicle = async (
    id: string | number,
    currentStatus: QueueStatus,
  ) => {
    try {
      setMovingVehicleId(id);

      let nextStatus: QueueStatus = currentStatus;

      if (currentStatus === "washing") {
        nextStatus = "detailing";
      } else if (currentStatus === "detailing") {
        nextStatus = "quality";
      } else if (currentStatus === "quality") {
        nextStatus = "completed";
      }

      const { error } = await supabase
        .from("queue_vehicles")
        .update({
          status: nextStatus,
        })
        .eq("id", id);

      if (error) throw error;

      await loadData();
    } catch (err) {
      console.error("MOVE ERROR:", err);
    } finally {
      setMovingVehicleId(null);
    }
  };

  /* =========================================================
     ASSIGN STAFF
  ========================================================= */
  const assignStaff = async () => {
    try {
      if (!assigningVehicle) return;

      setAssignLoading(true);

      const { data, error } = await supabase
        .from("queue_vehicles")
        .update({
          assigned_staff: staffName,
          bay: bayName,
          status: "washing",
        })
        .eq("id", assigningVehicle.id)
        .select();

      if (error) {
        throw error;
      }

      await loadData();

      setAssigningVehicle(null);
      setStaffName("");
      setBayName("");
    } catch (err) {
      console.error("ASSIGN ERROR:", err);
    } finally {
      setAssignLoading(false);
    }
  };

  /* =========================================================
     COLUMNS
  ========================================================= */

  const columns = [
    {
      key: "waiting",

      title: "Waiting",

      icon: Clock3,

      color: "text-yellow-400",
    },

    {
      key: "washing",

      title: "Washing",

      icon: Car,

      color: "text-cyan-400",
    },

    {
      key: "detailing",

      title: "Detailing",

      icon: Sparkles,

      color: "text-purple-400",
    },

    {
      key: "quality",

      title: "Quality Check",

      icon: ShieldCheck,

      color: "text-orange-400",
    },

    {
      key: "completed",

      title: "Completed",

      icon: CheckCircle2,

      color: "text-emerald-400",
    },
  ];

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#020817] text-white p-4 md:p-6 space-y-6 overflow-x-hidden">
      {/* =========================================================
    HEADER
========================================================= */}

      <div
        className="
    relative
    overflow-hidden
    rounded-[30px]
    border
    border-white/10
    bg-gradient-to-br
    from-[#0B172C]
    via-[#08111F]
    to-[#050B16]
    p-4
    sm:p-6
    lg:p-7
  "
      >
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* ================= LEFT ================= */}

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className="
          flex
          h-14
          w-14
          sm:h-16
          sm:w-16
          shrink-0
          items-center
          justify-center
          rounded-3xl
          bg-gradient-to-br
          from-cyan-500
          via-sky-500
          to-blue-600
          shadow-[0_15px_35px_rgba(6,182,212,.35)]
        "
            >
              <Car className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Queue Management
                </h1>

                <span
                  className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-emerald-500/20
              bg-emerald-500/10
              px-3
              py-1
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-emerald-400
            "
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <p className="mt-2 max-w-xl text-sm text-slate-400 leading-relaxed">
                Monitor vehicle queues, assign wash bays, and track every wash
                in real time across all branches.
              </p>
            </div>
          </div>

          {/* ================= RIGHT ================= */}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Branch Selector */}
            <div className="relative flex-1 lg:flex-none">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="
            h-12
            w-full
            sm:min-w-[240px]
            rounded-2xl
            border
            border-white/10
            bg-white/[0.04]
            backdrop-blur-xl
            px-4
            text-sm
            text-white
            transition-all
            duration-300
            focus:border-cyan-400
            focus:ring-2
            focus:ring-cyan-400/20
            hover:border-cyan-500/30
          "
              >
                <option value="all">All Branches</option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
         STATS
      ========================================================= */}
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#061127] to-[#040B18] p-4">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              title: "Total",
              value: queueStats.total,
              icon: Car,
              color: "text-white",
            },
            {
              title: "Waiting",
              value: queueStats.waiting,
              icon: Clock3,
              color: "text-cyan-400",
              active: true,
            },
            {
              title: "Washing",
              value: queueStats.washing,
              icon: Waves,
              color: "text-yellow-400",
            },
            {
              title: "Completed",
              value: queueStats.completed,
              icon: CheckCircle2,
              color: "text-emerald-400",
            },
            {
              title: "VIP",
              value: queueStats.vip,
              icon: Crown,
              color: "text-amber-400",
            },
            {
              title: "Express",
              value: queueStats.express,
              icon: GaugeCircle,
              color: "text-purple-400",
            },
          ].map((card, i) => {
            const Icon = card.icon;

            return (
              <div
                key={i}
                className={`
            flex items-center gap-4
            rounded-3xl
            px-4 py-5
            transition-all duration-300
            ${card.active ? "bg-white/5 shadow-lg" : "hover:bg-white/[0.03]"}
          `}
              >
                <div
                  className="
              flex h-14 w-14 shrink-0
              items-center justify-center
              rounded-2xl
              border border-cyan-500/20
              bg-cyan-500/10
            "
                >
                  <Icon className="h-6 w-6 text-cyan-400" />
                </div>

                <div>
                  <div
                    className={`text-4xl font-black leading-none ${card.color}`}
                  >
                    {card.value}
                  </div>

                  <div className="mt-1 text-sm text-slate-400">
                    {card.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
      SEARCH + FILTERS
      ========================================================= */}

      <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          {/* SEARCH */}

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plate, customer, ticket..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-white outline-none"
            />
          </div>

          {/* PRIORITY */}

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4"
          >
            <option value="all">All Priorities</option>

            <option value="VIP">VIP</option>

            <option value="Express">Express</option>

            <option value="Fleet">Fleet</option>

            <option value="Normal">Normal</option>
          </select>

          {/* BAY */}

          <select
            value={selectedBay}
            onChange={(e) => setSelectedBay(e.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4"
          >
            <option value="all">All Bays</option>

            {bays.map((bay) => (
              <option key={bay.id} value={bay.name}>
                {bay.name}
              </option>
            ))}
          </select>

          {/* RESULTS */}

          <div className="flex items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4">
            <span className="font-semibold text-cyan-300">
              {filteredVehicles.length} Vehicles
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
         LIVE KANBAN QUEUE
      ========================================================= */}

      <div className="grid gap-5 2xl:grid-cols-5 xl:grid-cols-3 md:grid-cols-2">
        {columns.map((column) => {
          const Icon = column.icon;

          let items = filteredVehicles.filter(
            (vehicle) => vehicle.status === column.key,
          );

          if (column.key === "completed") {
            items = items
              .sort(
                (a, b) =>
                  new Date(b.created_at || "").getTime() -
                  new Date(a.created_at || "").getTime(),
              )
              .slice(0, 1);
          }

          return (
            <div
              key={column.key}
              className="rounded-3xl border border-white/10 bg-[#0B1220] p-4 min-h-[700px]"
            >
              {/* COLUMN HEADER */}

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40">
                    <Icon className={`h-5 w-5 ${column.color}`} />
                  </div>

                  <div>
                    <h2 className={`text-lg font-bold ${column.color}`}>
                      {column.title}
                    </h2>

                    <p className="text-xs text-slate-500">
                      {items.length} Vehicles
                    </p>
                  </div>
                </div>
              </div>

              {/* VEHICLES */}

              <div className="space-y-4">
                {items.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="group rounded-3xl border border-white/10 bg-black/30 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                  >
                    {/* TOP */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold">{vehicle.plate}</h3>

                          {vehicle.priority && (
                            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
                              {vehicle.priority}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {vehicle.vehicle}
                        </p>
                      </div>

                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold">
                        {vehicle.ticket}
                      </span>
                    </div>

                    {/* CUSTOMER */}
                    <div className="mt-3">
                      <p className="text-sm text-slate-300">
                        {vehicle.customer}
                      </p>
                    </div>

                    {/* SERVICE */}
                    <div className="mt-4 rounded-2xl border border-white/5 bg-[#0B1220] p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">Service</p>

                          <h4 className="mt-1 font-semibold">
                            {vehicle.service}
                          </h4>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    {/* INFO */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#0B1220] p-3">
                        <p className="text-xs text-slate-500">Bay</p>

                        <h4 className="mt-1 font-semibold">
                          {vehicle.bay || "Waiting Bay"}
                        </h4>
                      </div>

                      <div className="rounded-2xl bg-[#0B1220] p-3">
                        <p className="text-xs text-slate-500">ETA</p>

                        <h4 className="mt-1 font-semibold">
                          {vehicle.eta || "Pending"}
                        </h4>
                      </div>
                    </div>

                    {/* STAFF */}
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/5 bg-[#0B1220] p-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />

                        <span className="text-sm">
                          {vehicle.assigned_staff || "Unassigned"}
                        </span>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          vehicle.payment === "Paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {vehicle.payment || "Pending"}
                      </span>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>Checked In</span>

                      <span>{vehicle.check_in || "—"}</span>
                    </div>

                    {/* ACTIONS */}
                    {vehicle.status === "waiting" && (
                      <button
                        onClick={() => setAssigningVehicle(vehicle)}
                        className="mt-4 w-full rounded-2xl bg-cyan-500 py-3 font-semibold text-white"
                      >
                        Assign Staff & Bay
                      </button>
                    )}

                    {vehicle.status === "washing" && (
                      <button
                        disabled={movingVehicleId === vehicle.id}
                        onClick={() => moveVehicle(vehicle.id, vehicle.status)}
                        className="mt-4 w-full rounded-2xl bg-purple-500 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {movingVehicleId === vehicle.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Moving...
                          </>
                        ) : (
                          "Move To Detailing"
                        )}
                      </button>
                    )}

                    {vehicle.status === "detailing" && (
                      <button
                        disabled={movingVehicleId === vehicle.id}
                        onClick={() => moveVehicle(vehicle.id, vehicle.status)}
                        className="mt-4 w-full rounded-2xl bg-orange-500 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {movingVehicleId === vehicle.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Moving...
                          </>
                        ) : (
                          "Move To Quality Check"
                        )}
                      </button>
                    )}

                    {vehicle.status === "quality" && (
                      <button
                        onClick={() => moveVehicle(vehicle.id, vehicle.status)}
                        className="mt-4 w-full rounded-2xl bg-emerald-500 py-3 font-semibold"
                      >
                        Complete Wash
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================
         ASSIGN STAFF MODAL
      ========================================================= */}

      {assigningVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0B1220] p-6">
            <h2 className="text-2xl font-bold">Assign Staff</h2>

            <p className="mt-2 text-sm text-slate-400">
              {assigningVehicle.plate}
            </p>

            {/* STAFF */}

            <div className="mt-5">
              <label className="mb-2 block text-sm text-slate-400">
                Assign Staff
              </label>

              <select
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 outline-none"
              >
                <option value="">Select Staff</option>

                {staff.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* BAY */}

            <div className="mt-4">
              <label className="mb-2 block text-sm text-slate-400">Bay</label>

              <select
                value={bayName}
                onChange={(e) => setBayName(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 outline-none"
              >
                <option value="">Select Bay</option>

                {bays.map((bay) => (
                  <option key={bay.id} value={bay.name}>
                    {bay.name}
                  </option>
                ))}
              </select>
            </div>

            {/* BUTTONS */}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setAssigningVehicle(null)}
                className="flex-1 rounded-2xl border border-white/10 py-3"
              >
                Cancel
              </button>

              <button
                disabled={assignLoading}
                onClick={assignStaff}
                className="flex-1 rounded-2xl bg-cyan-500 py-3 font-semibold text-white"
              >
                {assignLoading ? "Assigning..." : "Assign & Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
