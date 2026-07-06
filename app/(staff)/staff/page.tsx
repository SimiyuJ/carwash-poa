"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Users,
  Plus,
  Search,
  Clock3,
  Trophy,
  DollarSign,
  User,
  Phone,
  Activity,
  Briefcase,
  Car,
  X,
  Edit,
  Trash2,
  Loader2,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* =========================================
   TYPES
========================================= */

type StaffStatus =
  | "active"
  | "on_break"
  | "off_duty";

type StaffRole =
  | "Manager"
  | "Supervisor"
  | "Cashier"
  | "Washer"
  | "Detailer";

type Staff = {
  id: number;
  carwash_id: string;
  branch_id: string;

  name: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;

  shift: string;
  performance: number;
  cars: number;
  revenue: number;

  currentTask: string;
  salary: number;

  responsibilities: string[];
};

/* =========================================
   PAGE
========================================= */

export default function StaffPage() {
  const [staff, setStaff] =
    useState<Staff[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [carwashId, setCarwashId] =
    useState<string | null>(null);

  const [branchId, setBranchId] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<string>("all");

  const [openModal, setOpenModal] =
    useState(false);

  const [
    openResponsibilities,
    setOpenResponsibilities,
  ] = useState<number | null>(null);

  const [editingStaff, setEditingStaff] =
    useState<Staff | null>(null);

  const [performance, setPerformance] =
    useState(0);

  const [revenueGenerated, setRevenueGenerated] =
    useState(0);

  const [formData, setFormData] =
    useState({
      name: "",
      phone: "",
      role: "Washer",
      shift: "Morning",
      salary: 0,
      responsibilities: "",
    });

  /* =========================================
     LOAD STAFF
  ========================================= */
  useEffect(() => {
    if (!carwashId || !branchId) return;

    fetchStaff();
  }, [carwashId, branchId]);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("carwash_id, branch_id")
          .eq("id", user.id)
          .single();

      if (!profile) return;

      setCarwashId(profile.carwash_id);
      setBranchId(profile.branch_id);
    };

    loadProfile();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);

      const { data, error } =
        await supabase
          .from("staff")
          .select("*")
          .eq("carwash_id", carwashId)
          .eq("branch_id", branchId)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "FETCH ERROR:",
          error
        );
        return;
      }

      const formatted: Staff[] = await Promise.all(
        (data || []).map(async (item: any) => {
          /* ==========================
             COMPLETED CARS
          ========================== */

          const { count: completedCars } =
            await supabase
              .from("queue_vehicles")
              .select("*", {
                count: "exact",
                head: true,
              })
              .eq("carwash_id", carwashId)
              .eq("branch_id", branchId)
              .eq("assigned_staff", item.name)
              .eq("status", "completed");

          /* ==========================
             TOTAL JOBS
          ========================== */

          const { count: totalJobs } =
            await supabase
              .from("queue_vehicles")
              .select("*", {
                count: "exact",
                head: true,
              })
              .eq("carwash_id", carwashId)
              .eq("branch_id", branchId)
              .eq("assigned_staff", item.name);

          const performance =
            totalJobs && totalJobs > 0
              ? Math.round(
                ((completedCars || 0) /
                  totalJobs) *
                100
              )
              : 0;

          return {
            id: item.id,
            carwash_id: item.carwash_id,
            branch_id: item.branch_id,
            name: item.name,
            phone: item.phone,
            role: item.role,
            status: item.status,
            shift: item.shift,

            performance,

            cars: completedCars || 0,

            revenue: 0,

            currentTask:
              item.current_task ||
              "Waiting Assignment",

            salary: item.salary || 0,

            responsibilities:
              item.responsibilities || [],
          };
        })
      );

      setStaff(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     FILTERED
  ========================================= */

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        member.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        member.role
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesFilter =
        filter === "all" ||
        member.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [staff, search, filter]);

  /* =========================================
     ADD STAFF
  ========================================= */

  const handleAddStaff =
    async () => {
      try {
        if (
          !formData.name ||
          !formData.phone
        ) {
          alert(
            "Please fill all required fields"
          );
          return;
        }

        setSaving(true);

        const payload = {
          carwash_id: carwashId,
          branch_id: branchId,

          name: formData.name,
          phone: formData.phone,
          role: formData.role,

          status: "active",
          shift: formData.shift,
          performance: 0,
          cars: 0,
          revenue: 0,
          current_task: "Waiting Assignment",

          salary: Number(formData.salary),

          responsibilities:
            formData.responsibilities
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
        };

        const { data, error } =
          await supabase
            .from("staff")
            .insert(payload)
            .select()
            .single();

        if (error) {
          console.error(
            "ADD STAFF ERROR:",
            error
          );

          alert(error.message);
          return;
        }

        const formatted: Staff = {
          id: data.id,
          carwash_id: data.carwash_id,
          branch_id: data.branch_id,
          name: data.name,
          phone: data.phone,
          role: data.role,
          status: data.status,
          shift: data.shift,
          performance:
            data.performance,
          cars: data.cars,
          revenue: data.revenue,
          currentTask:
            data.current_task,
          salary: data.salary,
          responsibilities:
            data.responsibilities ||
            [],
        };

        setStaff((prev) => [
          formatted,
          ...prev,
        ]);

        resetForm();
      } catch (err: any) {
        console.error(err);

        alert(
          err?.message ||
          "Failed to add staff"
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================
     EDIT
  ========================================= */

  const openEdit = (
    member: Staff
  ) => {
    setEditingStaff(member);

    setFormData({
      name: member.name,
      phone: member.phone,
      role: member.role,
      shift: member.shift,
      salary: member.salary,
      responsibilities:
        member.responsibilities.join(
          ", "
        ),
    });

    setOpenModal(true);
  };

  const handleSaveEdit =
    async () => {
      if (!editingStaff) return;

      try {
        setSaving(true);

        const payload = {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          shift: formData.shift,
          salary: Number(
            formData.salary
          ),
          responsibilities:
            formData.responsibilities
              .split(",")
              .map((item) =>
                item.trim()
              )
              .filter(Boolean),
        };

        const { error } =
          await supabase
            .from("staff")
            .update(payload)
            .eq("id", editingStaff.id)
            .eq("carwash_id", carwashId)
            .eq("branch_id", branchId);

        if (error) {
          console.error(error);

          alert(
            "Failed to update staff"
          );

          return;
        }

        setStaff((prev) =>
          prev.map((member) => {
            if (
              member.id ===
              editingStaff.id
            ) {
              return {
                ...member,
                name: payload.name,
                phone:
                  payload.phone,
                role:
                  payload.role as StaffRole,
                shift:
                  payload.shift,
                salary:
                  payload.salary,
                responsibilities:
                  payload.responsibilities,
              };
            }

            return member;
          })
        );

        resetForm();
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    };

  /* =========================================
     DELETE
  ========================================= */

  const handleDelete =
    async (id: number) => {
      const confirmDelete =
        confirm(
          "Delete this staff member?"
        );

      if (!confirmDelete) return;

      try {
        const { error } =
          await supabase
            .from("staff")
            .delete()
            .eq("id", id)
            .eq("carwash_id", carwashId)
            .eq("branch_id", branchId);

        if (error) {
          console.error(error);

          alert(
            "Failed to delete"
          );

          return;
        }

        setStaff((prev) =>
          prev.filter(
            (member) =>
              member.id !== id
          )
        );
      } catch (err) {
        console.error(err);
      }
    };

  /* =========================================
     RESET
  ========================================= */

  const resetForm = () => {
    setOpenModal(false);

    setEditingStaff(null);

    setFormData({
      name: "",
      phone: "",
      role: "Washer",
      shift: "Morning",
      salary: 0,
      responsibilities: "",
    });
  };

  /* =========================================
     STATS
  ========================================= */

  const totalRevenue =
    staff.reduce(
      (acc, member) =>
        acc + member.revenue,
      0
    );

  const activeToday =
    staff.filter(
      (member) =>
        member.status ===
        "active"
    ).length;

  const topPerformer =
    [...staff].sort(
      (a, b) =>
        b.performance -
        a.performance
    )[0];

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 space-y-8">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white">
            Staff Management
          </h1>

          <p className="text-gray-400 mt-2 text-lg">
            Manage employees,
            shifts &
            performance
          </p>
        </div>

        <Button
          onClick={() =>
            setOpenModal(true)
          }
          className="gap-2 rounded-2xl bg-cyan-400 hover:bg-cyan-500 text-white px-6 py-6 text-lg font-semibold shadow-[0_0_25px_rgba(0,255,255,0.25)]"
        >
          <Plus className="h-5 w-5" />
          Add Staff
        </Button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Staff"
          value={staff.length}
          icon={Users}
          glow="cyan"
        />

        <StatCard
          title="Active Today"
          value={activeToday}
          icon={Activity}
          glow="emerald"
        />

        <StatCard
          title="Monthly Revenue"
          value={`KES ${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          glow="purple"
        />

        <StatCard
          title="Top Performer"
          value={
            topPerformer?.name ||
            "N/A"
          }
          icon={Trophy}
          glow="amber"
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
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search staff..."
              className="pl-10 h-12 bg-[#0B1220] border-white/10 text-white rounded-2xl"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              "all",
              "active",
              "on_break",
              "off_duty",
            ].map((item) => (
              <Button
                key={item}
                onClick={() =>
                  setFilter(item)
                }
                variant={
                  filter === item
                    ? "default"
                    : "outline"
                }
                className={`rounded-2xl capitalize ${filter === item
                  ? "bg-cyan-400 text-white"
                  : "bg-white/5 border-white/10 text-white"
                  }`}
              >
                {item.replace(
                  "_",
                  " "
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* STAFF GRID */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.map(
          (member) => (
            <div
              key={member.id}
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#050816] p-[1px] transition-all duration-500 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_0_40px_rgba(0,255,255,0.12)]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.18),transparent_60%)]" />

              <div className="relative rounded-3xl bg-[#040B1A] p-6 h-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-cyan-400" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {
                          member.name
                        }
                      </h2>

                      <p className="text-gray-400 text-sm mt-1">
                        {
                          member.role
                        }
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={`border-0 capitalize ${member.status ===
                      "active"
                      ? "bg-emerald-500 text-white"
                      : member.status ===
                        "on_break"
                        ? "bg-amber-500 text-black"
                        : "bg-red-500 text-white"
                      }`}
                  >
                    {member.status.replace(
                      "_",
                      " "
                    )}
                  </Badge>
                </div>

                <div className="mt-6 space-y-4 text-sm">
                  <InfoRow
                    icon={Phone}
                    label={
                      member.phone
                    }
                  />

                  <InfoRow
                    icon={
                      Briefcase
                    }
                    label={`${member.shift} Shift`}
                  />

                  <InfoRow
                    icon={Car}
                    label={`${member.cars} Cars Completed`}
                  />

                  <InfoRow
                    icon={Clock3}
                    label={
                      member.currentTask
                    }
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">
                      Performance
                    </p>

                    <p className="text-cyan-400 font-bold">
                      {
                        member.performance
                      }
                      %
                    </p>
                  </div>

                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{
                        width: `${member.performance}%`,
                      }}
                    />
                  </div>
                </div>

                {/* RESPONSIBILITIES */}

                <div className="mt-6">
                  <Button
                    onClick={() =>
                      setOpenResponsibilities(
                        openResponsibilities ===
                          member.id
                          ? null
                          : member.id
                      )
                    }
                    className="w-full rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Responsibilities
                  </Button>

                  {openResponsibilities ===
                    member.id && (
                      <div className="mt-4 rounded-2xl bg-[#0B1220] border border-white/10 p-4 space-y-3">
                        {member
                          .responsibilities
                          ?.length >
                          0 ? (
                          member.responsibilities.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="flex items-start gap-3 text-sm text-gray-300"
                              >
                                <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5" />

                                <span>
                                  {
                                    item
                                  }
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-sm text-gray-500">
                            No
                            responsibilities
                            added
                          </p>
                        )}
                      </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      Revenue
                      Generated
                    </p>

                    <p className="text-2xl font-black text-white mt-1">
                      KES{" "}
                      {member.revenue.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        openEdit(
                          member
                        )
                      }
                      size="icon"
                      className="rounded-2xl bg-white/5 hover:bg-cyan-500"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={() =>
                        handleDelete(
                          member.id
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
            </div>
          )
        )}
      </div>

      {/* MODAL */}

      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={resetForm}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#081120] p-8 shadow-[0_0_60px_rgba(0,255,255,0.15)]"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">
                  {editingStaff
                    ? "Edit Staff"
                    : "Add Staff"}
                </h2>

                <p className="text-gray-400 mt-2">
                  Manage employee
                  profile
                  information
                </p>
              </div>

              <button
                onClick={
                  resetForm
                }
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Full Name
                </p>

                <Input
                  value={
                    formData.name
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target
                        .value,
                    })
                  }
                  placeholder="John Doe"
                  className="h-12 rounded-2xl bg-[#0B1220] border-white/10 text-white"
                />
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Phone Number
                </p>

                <Input
                  value={
                    formData.phone
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone:
                        e.target
                          .value,
                    })
                  }
                  placeholder="+254 700 000 000"
                  className="h-12 rounded-2xl bg-[#0B1220] border-white/10 text-white"
                />
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Role
                </p>

                <select
                  value={
                    formData.role
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target
                        .value,
                    })
                  }
                  className="w-full h-12 rounded-2xl bg-[#0B1220] border border-white/10 text-white px-4"
                >
                  <option>
                    Manager
                  </option>
                  <option>
                    Supervisor
                  </option>
                  <option>
                    Cashier
                  </option>
                  <option>
                    Washer
                  </option>
                  <option>
                    Detailer
                  </option>
                </select>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Shift
                </p>

                <select
                  value={
                    formData.shift
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shift:
                        e.target
                          .value,
                    })
                  }
                  className="w-full h-12 rounded-2xl bg-[#0B1220] border border-white/10 text-white px-4"
                >
                  <option>
                    Morning
                  </option>
                  <option>
                    Evening
                  </option>
                  <option>
                    Night
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-2">
                  Monthly Salary
                  (KES)
                </p>

                <Input
                  type="number"
                  value={
                    formData.salary
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary:
                        Number(
                          e.target
                            .value
                        ),
                    })
                  }
                  placeholder="25000"
                  className="h-12 rounded-2xl bg-[#0B1220] border-white/10 text-white"
                />
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-2">
                  Responsibilities
                </p>

                <Input
                  value={
                    formData.responsibilities
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsibilities:
                        e.target
                          .value,
                    })
                  }
                  placeholder="Vehicle inspection, Customer support, Premium wash..."
                  className="h-12 rounded-2xl bg-[#0B1220] border-white/10 text-white"
                />

                <p className="text-xs text-gray-500 mt-2">
                  Separate
                  responsibilities
                  using commas
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <Button
                onClick={
                  resetForm
                }
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>

              <Button
                disabled={saving}
                onClick={
                  editingStaff
                    ? handleSaveEdit
                    : handleAddStaff
                }
                className="h-12 px-8 rounded-2xl bg-cyan-400 hover:bg-cyan-500 text-white font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingStaff ? (
                  "Save Changes"
                ) : (
                  "Add Staff"
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
   STAT CARD
========================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  glow,
}: any) {
  const glowStyles: any = {
    cyan:
      "bg-cyan-500/10 border-cyan-500/10 text-cyan-400",

    emerald:
      "bg-emerald-500/10 border-emerald-500/10 text-emerald-400",

    purple:
      "bg-purple-500/10 border-purple-500/10 text-purple-400",

    amber:
      "bg-amber-500/10 border-amber-500/10 text-amber-400",
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-[#040B1A] p-6 shadow-[0_0_40px_rgba(0,255,255,0.05)]">
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
          className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${glowStyles[glow]}`}
        >
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

/* =========================================
   INFO ROW
========================================= */

function InfoRow({
  icon: Icon,
  label,
}: any) {
  return (
    <div className="flex items-center gap-3 text-gray-300">
      <div className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>

      <span>{label}</span>
    </div>
  );
}