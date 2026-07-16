"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Search,
  Plus,
  Droplets,
  Clock3,
  Sparkles,
  Settings2,
  Trash2,
  TrendingUp,
  Pencil,
  LucideIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Building2,
  GitBranch,
  Crown,
  Activity,
  DollarSign,
  Layers3,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

/* =========================================================
   TYPES
========================================================= */

interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface VehicleType {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface ServicePrice {
  id?: string;
  carwash_id?: string;
  service_id?: string;
  branch_id?: string;

  vehicle_type_id: string;

  price: number;

  vehicle_types?: {
    id?: string;
    name?: string;
  };
}

interface Service {
  id: string;
  carwash_id?: string;
  branch_id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  status: string;
  category_id: string;
  featured?: boolean;
  created_at: string;

  branches?: {
    id?: string;
    name?: string;
  };

  service_categories?: {
    id?: string;
    name?: string;
  };

  service_prices?: ServicePrice[];
}

/* =========================================================
   PAGE
========================================================= */

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [otherVehicleOpen, setOtherVehicleOpen] = useState(false);

  const [newVehicleType, setNewVehicleType] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [editingService, setEditingService] = useState<Service | null>(null);

  const [userRole, setUserRole] = useState<string>("staff");
  const [businessId, setBusinessId] = useState<string>("");

  const [profile, setProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    branch_id: "",
    duration_minutes: 20,
    status: "active",
  });

  const [vehiclePrices, setVehiclePrices] = useState<
    {
      vehicle_type_id: string;
      price: number;
    }[]
  >([]);

  const [additionalServices, setAdditionalServices] = useState<
    {
      id: string;
      name: string;
      description?: string;

      prices: {
        vehicle_type_id: string;
        price: number;
      }[];
    }[]
  >([]);

  const [addonModalOpen, setAddonModalOpen] = useState(false);

  const [addonForm, setAddonForm] = useState({
    name: "",
    description: "",
  });

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchServices();
    }
  }, [selectedBranch]);

  /* =========================================================
     INIT
  ========================================================= */

  async function initializePage() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        return;
      }

      setProfile(profileData);
      setUserRole(profileData?.role || "staff");
      setBusinessId(profileData?.carwash_id || "");

      await Promise.allSettled([
        fetchVehicleTypes(profileData?.carwash_id),
        fetchBranches(profileData?.carwash_id),
        fetchCategories(profileData?.carwash_id),
        fetchServices(profileData?.carwash_id),
      ]);
    } catch (error) {
      console.error("INITIALIZE PAGE ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     BRANCHES
  ========================================================= */

  async function fetchBranches(business?: string) {
    try {
      const biz = business || businessId;

      if (!biz) return;

      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("carwash_id", biz)
        .eq("carwash_id", business || businessId)
        .order("name");

      if (error) {
        console.error("BRANCHES ERROR:", error);
        return;
      }

      setBranches(data || []);
    } catch (error) {
      console.error("FETCH BRANCHES EXCEPTION:", error);
    }
  }
  /* =========================================================
    FETCH VEHICLE TYPES
 ========================================================= */
  async function fetchVehicleTypes(business?: string) {
    try {
      const { data, error } = await supabase
        .from("vehicle_types")
        .select("*")
        .order("name");

      if (error) throw error;

      setVehicleTypes(data || []);
    } catch (error) {
      console.error("FETCH VEHICLE TYPES ERROR:", error);
    }
  }
  /* =========================================================
     
  ========================================================= */
  async function handleCreateVehicleType() {
    try {
      if (!newVehicleType.trim()) {
        alert("Vehicle/service type required");
        return;
      }

      const { error } = await supabase.from("vehicle_types").insert({
        carwash_id: businessId,
        name: newVehicleType,
      });

      if (error) throw error;

      await fetchVehicleTypes();

      setNewVehicleType("");

      setOtherVehicleOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create vehicle type");
    }
  }

  function handleAddAdditionalService() {
    if (!addonForm.name.trim()) {
      alert("Addon service name required");
      return;
    }

    setAdditionalServices((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: addonForm.name,
        description: addonForm.description,
        prices: [],
      },
    ]);

    setAddonForm({
      name: "",
      description: "",
    });

    setAddonModalOpen(false);
  }

  /* =========================================================
     CATEGORIES
  ========================================================= */

  async function fetchCategories(business?: string) {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("CATEGORIES ERROR:", error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("CATEGORIES EXCEPTION:", error);
    }
  }

  /* =========================================================
     SERVICES
  ========================================================= */
  async function fetchServices(business?: string) {
    try {
      setStatsLoading(true);

      const businessFilter = business || businessId;

      if (!businessFilter) return;

      let query = supabase
        .from("services")
        .select(
          `
        id,
        carwash_id,
        branch_id,
        category_id,
        name,
        description,
        duration_minutes,
        status,
        created_at,

        branches!services_branch_id_fkey (
          id,
          name
        ),

        service_categories!services_category_id_fkey (
          id,
          name
        ),

        service_prices (
          id,
          service_id,
          carwash_id,
          branch_id,
          vehicle_type_id,
          price,

          vehicle_types!service_prices_vehicle_type_id_fkey (
            id,
            name
          )
        )
      `,
        )
        .eq("carwash_id", businessFilter);

      if (selectedBranch !== "all") {
        query = query.eq("branch_id", selectedBranch);
      }

      const { data, error } = await query;

      if (error) {
        console.error("FETCH SERVICES ERROR:", error);
        return;
      }

      setServices((data as Service[]) || []);
    } catch (err) {
      console.error("FETCH SERVICES CRASH:", err);
    } finally {
      setStatsLoading(false);
    }
  }

  /* =========================================================
     RESET FORM
  ========================================================= */

  function resetForm() {
    setEditingService(null);

    setFormData({
      name: "",
      description: "",
      category_id: "",
      branch_id: branches[0]?.id || "",
      duration_minutes: 20,
      status: "active",
    });

    setVehiclePrices([]);
  }

  /* =========================================================
     EDIT
  ========================================================= */

  function handleEdit(service: Service) {
    setEditingService(service);

    setFormData({
      name: service.name || "",
      description: service.description || "",
      category_id: service.category_id || "",
      branch_id: service.branch_id || "",
      duration_minutes: service.duration_minutes || 20,
      status: service.status || "active",
    });

    setVehiclePrices(
      service.service_prices?.map((price) => ({
        vehicle_type_id: price.vehicle_type_id,
        price: Number(price.price),
      })) || [],
    );

    setOpen(true);
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSaveService() {
    try {
      setSaving(true);

      if (!formData.name.trim()) {
        alert("Service name required");
        return;
      }

      if (!formData.category_id) {
        alert("Select category");
        return;
      }

      if (!formData.branch_id) {
        alert("Select branch");
        return;
      }

      let serviceId = editingService?.id;

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update({
            name: formData.name,
            description: formData.description,
            category_id: formData.category_id,
            branch_id: formData.branch_id,
            duration_minutes: formData.duration_minutes,
            status: formData.status,
          })
          .eq("id", editingService.id)
          .eq("carwash_id", businessId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("services")
          .insert({
            carwash_id: businessId,
            branch_id: formData.branch_id,
            name: formData.name,
            description: formData.description,
            category_id: formData.category_id,
            duration_minutes: formData.duration_minutes,
            status: formData.status,
          })
          .select()
          .single();

        if (error) throw error;

        serviceId = data.id;
      }

      await supabase
        .from("service_prices")
        .delete()
        .eq("service_id", serviceId)
        .eq("carwash_id", businessId)
        .eq("branch_id", formData.branch_id);

      if (vehiclePrices.length > 0) {
        const payload = vehiclePrices
          .filter((v) => v.price > 0)
          .map((v) => ({
            carwash_id: businessId,
            service_id: serviceId,
            branch_id: formData.branch_id,
            vehicle_type_id: v.vehicle_type_id,
            price: v.price,
          }));

        await supabase.from("service_prices").insert(payload);
      }

      await fetchServices();

      resetForm();

      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save service");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDeleteService(id: string) {
    const confirmDelete = window.confirm("Delete this service?");

    if (!confirmDelete) return;

    try {
      await supabase.from("service_prices").delete().eq("service_id", id);

      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        .eq("carwash_id", businessId);

      if (error) throw error;

      await fetchServices();
    } catch (error) {
      console.error(error);
      alert("Failed to delete service");
    }
  }

  /* =========================================================
     FILTERED SERVICES
  ========================================================= */

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name?.toLowerCase().includes(search.toLowerCase()) ||
        service.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || service.category_id === selectedCategory;

      const matchesBranch =
        selectedBranch === "all" || service.branch_id === selectedBranch;

      return matchesSearch && matchesCategory && matchesBranch;
    });
  }, [services, search, selectedCategory, selectedBranch]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: services.length,
      active: services.filter((s) => s.status === "active").length,
      inactive: services.filter((s) => s.status === "inactive").length,
      branches: branches.length,
      categories: categories.length,
    };
  }, [services, branches, categories]);

  type KPIItemProps = {
    icon: LucideIcon;
    value: number | string;
    label: string;
    color: "cyan" | "emerald" | "amber" | "violet" | "blue" | "rose";
  };

  const colors = {
    cyan: {
      border: "border-cyan-500/20",
      bg: "bg-cyan-500/10",
      icon: "bg-cyan-500/15 text-cyan-400",
      value: "text-cyan-300",
    },

    emerald: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      icon: "bg-emerald-500/15 text-emerald-400",
      value: "text-emerald-300",
    },

    amber: {
      border: "border-yellow-500/20",
      bg: "bg-yellow-500/10",
      icon: "bg-yellow-500/15 text-yellow-400",
      value: "text-yellow-300",
    },

    violet: {
      border: "border-purple-500/20",
      bg: "bg-purple-500/10",
      icon: "bg-purple-500/15 text-purple-400",
      value: "text-purple-300",
    },

    blue: {
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      icon: "bg-blue-500/15 text-blue-400",
      value: "text-blue-300",
    },

    rose: {
      border: "border-rose-500/20",
      bg: "bg-rose-500/10",
      icon: "bg-rose-500/15 text-rose-400",
      value: "text-rose-300",
    },
  };

  function KPIItem({ icon: Icon, value, label, color }: KPIItemProps) {
    const c = colors[color];

    return (
      <div
        className={`group rounded-2xl border ${c.border} ${c.bg} p-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${c.icon}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <h3 className={`text-base leading-none font-black ${c.value}`}>
            {value}
          </h3>

          <p className="mt-1 truncate text-[9px] font-semibold tracking-wider text-slate-500 uppercase">
            {label}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="flex items-center gap-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-8 py-6">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />

          <div>
            <h2 className="font-bold">Loading Services</h2>

            <p className="text-sm text-slate-400">
              Preparing your multi branch system...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-[-10%] h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[20%] h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1800px] space-y-6 p-4 md:p-6">
        {/* HERO HEADER */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0B1220] via-[#07101F] to-[#020617] p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />

                <span className="text-[11px] font-semibold tracking-wide text-cyan-300 uppercase">
                  Smart Multi-Branch
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Services Management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Manage services, pricing and availability across all branches
                from one dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={initializePage}
                variant="outline"
                className="h-14 rounded-2xl border-white/10 bg-white/5 px-6 text-white hover:bg-white/10"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              {(userRole === "admin" || userRole === "manager") && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetForm}
                      className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 font-bold text-white"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Create Service
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-h-[95vh] overflow-y-auto border-white/10 bg-[#07101F] text-white sm:max-w-5xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black">
                        {editingService ? "Edit Service" : "Create New Service"}
                      </DialogTitle>

                      <DialogDescription className="text-slate-400">
                        Configure service details, vehicle pricing, and branch
                        settings.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8">
                      {/* FORM */}

                      <div className="grid gap-5 md:grid-cols-2">
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Service Name"
                          className="h-12 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                        />

                        <Input
                          type="number"
                          value={formData.duration_minutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration_minutes: Number(e.target.value),
                            })
                          }
                          placeholder="Duration"
                          className="h-12 rounded-2xl border-white/10 bg-[#0B1220] text-white"
                        />
                      </div>

                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Service Description"
                        className="min-h-[120px] w-full rounded-3xl border border-white/10 bg-[#0B1220] p-4 text-white outline-none"
                      />

                      <div className="grid gap-5 md:grid-cols-2">
                        <select
                          value={formData.branch_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              branch_id: e.target.value,
                            })
                          }
                          className="h-12 rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white"
                        >
                          <option value="">Select Branch</option>

                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={formData.category_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category_id: e.target.value,
                            })
                          }
                          className="h-12 rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white"
                        >
                          <option value="">Select Category</option>

                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SERVICE PRICING MATRIX */}

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-black text-white">
                            Service Pricing
                          </h3>

                          <p className="text-sm text-slate-400">
                            Configure pricing for every vehicle type and extra
                            service
                          </p>
                        </div>

                        {/* VEHICLE TYPES */}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold tracking-wider text-cyan-400 uppercase">
                              Vehicle Type Pricing
                            </h4>

                            <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                              {vehicleTypes.length} Vehicle Types
                            </Badge>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            {vehicleTypes.map((vehicle) => {
                              const existingPrice =
                                vehiclePrices.find(
                                  (v) =>
                                    String(v.vehicle_type_id) ===
                                    String(vehicle.id),
                                )?.price || "";

                              return (
                                <div
                                  key={vehicle.id}
                                  className="rounded-3xl border border-white/10 bg-[#0B1220] p-5"
                                >
                                  <div className="mb-4 flex items-center justify-between">
                                    <div>
                                      <h4 className="text-lg font-black text-white">
                                        {vehicle.name}
                                      </h4>

                                      <p className="text-xs text-slate-500">
                                        Price for this vehicle type
                                      </p>
                                    </div>

                                    <div className="rounded-2xl bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                                      VEHICLE
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-slate-400">
                                      KES
                                    </div>

                                    <Input
                                      type="number"
                                      placeholder="Enter price"
                                      value={existingPrice}
                                      onChange={(e) => {
                                        const value = Number(e.target.value);

                                        setVehiclePrices((prev) => {
                                          const exists = prev.find(
                                            (p) =>
                                              String(p.vehicle_type_id) ===
                                              String(vehicle.id),
                                          );

                                          if (exists) {
                                            return prev.map((p) =>
                                              String(p.vehicle_type_id) ===
                                              String(vehicle.id)
                                                ? {
                                                    ...p,
                                                    price: value,
                                                  }
                                                : p,
                                            );
                                          }

                                          return [
                                            ...prev,
                                            {
                                              vehicle_type_id: vehicle.id,
                                              price: value,
                                            },
                                          ];
                                        });
                                      }}
                                      className="h-14 rounded-2xl border-white/10 bg-[#020617] text-lg font-bold text-white"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* OTHER SERVICES */}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold tracking-wider text-purple-400 uppercase">
                              Additional Services
                            </h4>

                            <Badge className="border-purple-500/20 bg-purple-500/10 text-purple-300">
                              Optional
                            </Badge>
                          </div>

                          <div className="rounded-3xl border border-dashed border-white/10 bg-[#0B1220] p-6">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
                                <Sparkles className="h-5 w-5 text-purple-400" />
                              </div>

                              <div className="flex-1">
                                <h4 className="font-bold text-white">
                                  Extra Addons & Special Services
                                </h4>

                                <p className="mt-1 text-sm text-slate-400">
                                  Add things like engine cleaning, perfume,
                                  polishing, carpet treatment, detailing, or
                                  custom services.
                                </p>

                                <Button
                                  type="button"
                                  onClick={() => setAddonModalOpen(true)}
                                  className="mt-4 rounded-2xl bg-purple-500/20 text-purple-200 hover:bg-purple-500/30"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Other Service
                                </Button>
                              </div>
                            </div>
                          </div>

                          {additionalServices.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2">
                              {additionalServices.map((addon) => (
                                <div
                                  key={addon.id}
                                  className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="text-lg font-black text-white">
                                        {addon.name}
                                      </h4>

                                      <p className="mt-1 text-sm text-slate-400">
                                        {addon.description || "No description"}
                                      </p>
                                    </div>

                                    <Badge className="bg-purple-500/20 text-purple-200">
                                      ADDON
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <Dialog
                        open={addonModalOpen}
                        onOpenChange={setAddonModalOpen}
                      >
                        <DialogContent className="border-white/10 bg-[#07101F] text-white sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">
                              Add Additional Service
                            </DialogTitle>

                            <DialogDescription className="text-slate-400">
                              Create addon services like polishing, engine
                              cleaning, perfume, vacuum, etc.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-5">
                            <Input
                              placeholder="Addon Service Name"
                              value={addonForm.name}
                              onChange={(e) =>
                                setAddonForm({
                                  ...addonForm,
                                  name: e.target.value,
                                })
                              }
                              className="h-12 rounded-2xl border-white/10 bg-[#0B1220]"
                            />

                            <textarea
                              placeholder="Description"
                              value={addonForm.description}
                              onChange={(e) =>
                                setAddonForm({
                                  ...addonForm,
                                  description: e.target.value,
                                })
                              }
                              className="min-h-[120px] w-full rounded-3xl border border-white/10 bg-[#0B1220] p-4 text-white outline-none"
                            />

                            <Button
                              onClick={handleAddAdditionalService}
                              className="h-12 w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600"
                            >
                              Create Addon Service
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        disabled={saving}
                        onClick={handleSaveService}
                        className="h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-lg font-bold text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving Service...
                          </>
                        ) : editingService ? (
                          "Update Service"
                        ) : (
                          "Create Service"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </motion.div>

        {/* =========================================
    KPI STATS
========================================= */}

        <div className="mb-5 rounded-3xl border border-cyan-500/10 bg-gradient-to-r from-[#061225] via-[#08152A] to-[#061225] p-2.5 shadow-lg shadow-black/20">
          <div className="grid grid-cols-6 gap-2">
            <KPIItem
              icon={Droplets}
              value={stats.total}
              label="Total"
              color="cyan"
            />

            <KPIItem
              icon={CheckCircle2}
              value={stats.active}
              label="Active"
              color="emerald"
            />

            <KPIItem
              icon={XCircle}
              value={stats.inactive}
              label="Inactive"
              color="amber"
            />

            <KPIItem
              icon={GitBranch}
              value={stats.branches}
              label="Branches"
              color="violet"
            />

            <KPIItem
              icon={Layers3}
              value={stats.categories}
              label="Categories"
              color="blue"
            />

            <KPIItem
              icon={TrendingUp}
              value={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}%`}
              label="Active %"
              color="rose"
            />
          </div>
        </div>

        {/* SERVICES */}

        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence>
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="group relative overflow-hidden rounded-[30px] border-white/10 bg-[#0B1220]/90 text-white backdrop-blur-xl">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between">
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                          <Droplets className="h-7 w-7 text-cyan-400" />
                        </div>

                        <div>
                          <h2 className="text-xl font-black text-white">
                            {service.name}
                          </h2>

                          <p className="mt-1 text-xs text-slate-400">
                            {service.description}
                          </p>
                        </div>
                      </div>

                      <Badge
                        className={
                          service.status === "active"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500/20 bg-red-500/10 text-red-400"
                        }
                      >
                        {service.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InfoCard
                        icon={Settings2}
                        label="Category"
                        value={service.service_categories?.name || "N/A"}
                      />

                      <InfoCard
                        icon={Clock3}
                        label="Duration"
                        value={`${service.duration_minutes} mins`}
                      />

                      <InfoCard
                        icon={Building2}
                        label="Branch"
                        value={service.branches?.name || "No Branch"}
                      />

                      <div className="col-span-2 rounded-2xl border border-white/5 bg-[#020617] p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <DollarSign className="h-4 w-4 text-cyan-400" />
                          <span className="text-xs">Vehicle Pricing</span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {service.service_prices?.length ? (
                            service.service_prices.map((price) => (
                              <div
                                key={price.id}
                                className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                              >
                                <span className="text-sm text-slate-300">
                                  {price.vehicle_types?.name || "Vehicle"}
                                </span>

                                <span className="font-semibold text-white">
                                  KES {price.price}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">
                              No pricing configured
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {(userRole === "admin" || userRole === "manager") && (
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleEdit(service)}
                          className="flex-1 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>

                        <Button
                          onClick={() => handleDeleteService(service.id)}
                          variant="destructive"
                          className="flex-1 rounded-2xl"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATS CARD
========================================================= */

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  glow,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  glow: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card
        className={`rounded-[28px] border-white/10 bg-[#0B1220]/90 text-white backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${glow}`}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">{title}</p>
              <h2 className="mt-3 text-4xl font-black">{value}</h2>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-[#020617]">
              <Icon className={`h-7 w-7 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KPIItem({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/5 md:h-12 md:w-12">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>

      <div>
        <h3 className={`text-2xl font-black md:text-3xl ${color}`}>{value}</h3>

        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#020617] p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 text-cyan-400" />
        <span className="text-xs">{label}</span>
      </div>

      <h3 className="mt-2 font-semibold">{value}</h3>
    </div>
  );
}
