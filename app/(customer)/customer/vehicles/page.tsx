"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VehicleModal from "@/components/vehicles/VehicleModal";
import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";

import { Car, Plus, Search, RefreshCw, Edit, Trash2 } from "lucide-react";

type Vehicle = {
  id: string;
  plate_number: string;
  type: string;
  color: string;
  created_at: string;
};

export default function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [plate, setPlate] = useState("");

  const [phone, setPhone] = useState("");
  const [requiresPhone, setRequiresPhone] = useState(false);
  const [vehicleType, setVehicleType] = useState("Sedan");

  const { activeBranch } = useActiveBranch();

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const vehicleTypes = [
    "Sedan",
    "SUV",
    "Hatchback",
    "Van",
    "Pickup",
    "Truck",
    "Motorcycle",
  ];

  const [color, setColor] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeBranch?.id) return;

    fetchVehicles();
  }, [activeBranch?.id]);

  useEffect(() => {
    async function checkPhone() {
      if (!showModal || !activeBranch?.id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer } = await supabase
        .from("customers")
        .select("phone")
        .eq("profile_id", user.id)
        .eq("branch_id", activeBranch.id)
        .maybeSingle();

      setRequiresPhone(!customer?.phone);
    }

    checkPhone();
  }, [showModal, activeBranch?.id]);

  async function fetchVehicles() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user.id)
        .eq("branch_id", activeBranch?.id)
        .maybeSingle();

      if (customerError || !customer) {
        setVehicles([]);
        return;
      }

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("branch_id", activeBranch?.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setVehicles(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) =>
      [vehicle.plate_number, vehicle.type, vehicle.color]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [vehicles, search]);

  const addVehicle = async () => {
    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("profile_id", user.id)
        .eq("branch_id", activeBranch?.id)
        .maybeSingle();

      if (customerError || !customer) {
        throw new Error("Customer record not found");
      }

      if (requiresPhone) {
        const { error: phoneError } = await supabase
          .from("customers")
          .update({
            phone: phone.trim(),
          })
          .eq("id", customer.id);

        if (phoneError) throw phoneError;
      }

      const cleanPlate = plate.trim().toUpperCase();

      if (editingVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update({
            plate_number: cleanPlate,
            type: vehicleType,
            color,
          })
          .eq("id", editingVehicle.id);

        if (error) throw error;

        setMessageType("success");
        setMessage("Vehicle updated successfully");

        setEditingVehicle(null);

        fetchVehicles();

        setTimeout(() => {
          setShowModal(false);
        }, 1000);

        return;
      }

      const { data: existingVehicle } = await supabase
        .from("vehicles")
        .select(
          `
          id,
          customer_id
          `,
        )
        .eq("customer_id", customer.id)
        .eq("branch_id", activeBranch?.id)
        .eq("plate_number", cleanPlate)
        .maybeSingle();

      if (existingVehicle && existingVehicle.customer_id === user.id) {
        // update
      } else if (existingVehicle) {
        throw new Error(
          "This vehicle is already registered to another account",
        );
      }

      if (existingVehicle) {
        const { error: updateError } = await supabase
          .from("vehicles")
          .update({
            customer_id: customer.id,
            profile_id: user.id,
            type: vehicleType,
            color,
          })
          .eq("id", existingVehicle.id);

        if (updateError) throw updateError;

        setMessageType("success");
        setMessage("Vehicle updated successfully");

        fetchVehicles();

        setTimeout(() => {
          setShowModal(false);
        }, 1000);

        return;
      }

      const { error } = await supabase.from("vehicles").insert({
        customer_id: customer.id,
        profile_id: user.id,
        plate_number: cleanPlate,
        type: vehicleType,
        color,
        branch_id: activeBranch?.id,
        carwash_id: activeBranch?.carwashId,
      });

      if (error) throw error;

      setMessageType("success");
      setMessage("Vehicle added successfully");

      setPlate("");
      setColor("");

      fetchVehicles();

      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    } catch (err: any) {
      setMessageType("error");
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    const confirmed = window.confirm("Delete this vehicle?");

    if (!confirmed) return;

    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

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
      {/* HERO */}

      <div className="relative mb-5 overflow-hidden rounded-[30px] border border-cyan-500/10 bg-gradient-to-br from-[#07142B] via-[#0A1D3D] to-[#07142B] shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_40%)]" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}

            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <div
                className="
            h-12
            w-12
            sm:h-14
            sm:w-14
            lg:h-16
            lg:w-16
            shrink-0
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            flex
            items-center
            justify-center
          "
              >
                <Car className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-cyan-400" />
              </div>

              <div className="min-w-0">
                <p className="uppercase tracking-[2px] sm:tracking-[4px] text-[10px] sm:text-xs font-semibold text-cyan-400">
                  My Garage
                </p>

                <h1 className="mt-1 text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-slate-100">
                  Your Vehicles
                </h1>

                <p className="mt-2 text-xs sm:text-sm lg:text-base text-slate-300 max-w-xl">
                  Register, manage and update all vehicles linked to your
                  account from one place.
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={fetchVehicles}
                className="
            h-11
            rounded-xl
            border-cyan-500/20
            bg-cyan-500/5
            px-4
            text-slate-200
            hover:bg-cyan-500/10
            hover:border-cyan-500/30
          "
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                onClick={() => setShowModal(true)}
                className="
            h-11
            rounded-xl
            bg-gradient-to-r
            from-cyan-500
            to-blue-600
            px-4
            font-semibold
            text-white
            shadow-lg
            shadow-cyan-500/20
            hover:from-cyan-600
            hover:to-blue-700
          "
              >
                <Plus className="mr-0 sm:mr-2 h-4 w-4" />

                <span className="hidden sm:inline">Add Vehicle</span>
              </Button>
            </div>
          </div>

          {/* QUICK STATS */}

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                Vehicles
              </p>

              <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-100">
                {vehicles.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                Types
              </p>

              <h2 className="mt-1 text-xl sm:text-2xl font-black text-cyan-400">
                {new Set(vehicles.map((v) => v.type)).size}
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                Colors
              </p>

              <h2 className="mt-1 text-xl sm:text-2xl font-black text-sky-300">
                {new Set(vehicles.map((v) => v.color)).size}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_360px] gap-6">
        {/* LEFT SIDE */}
        <div className="space-y-6">
          {/* SEARCH */}

          <Card className="relative overflow-hidden rounded-[28px] border border-cyan-500/10 bg-gradient-to-br from-[#07142B] via-[#0A1D3D] to-[#07142B]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.12),transparent_45%)]" />

            <CardContent className="relative p-3 sm:p-4">
              <div
                className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-cyan-500/10
        bg-[#091A34]/80
        px-4
        h-12
        sm:h-14
        transition-all
        duration-300
        focus-within:border-cyan-500/30
        focus-within:bg-[#0B1F3F]
        focus-within:shadow-lg
        focus-within:shadow-cyan-500/10
      "
              >
                <Search className="h-5 w-5 text-cyan-400 shrink-0" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search registration..."
                  className="
          flex-1
          bg-transparent
          text-sm
          sm:text-base
          text-slate-100
          placeholder:text-slate-500
          outline-none
        "
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="
            h-7
            w-7
            rounded-full
            bg-white/5
            text-slate-400
            transition-colors
            hover:bg-white/10
            hover:text-white
            flex
            items-center
            justify-center
          "
                  >
                    ×
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* EMPTY */}

          {!loading && filteredVehicles.length === 0 && (
            <Card className="relative overflow-hidden rounded-[30px] border border-cyan-500/10 bg-gradient-to-br from-[#07142B] via-[#0A1D3D] to-[#07142B]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.15),transparent_45%)]" />

              <CardContent className="relative flex flex-col items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
                {/* Icon */}

                <div
                  className="
          mb-5
          flex
          h-16
          w-16
          sm:h-20
          sm:w-20
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
                  <Car className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-400" />
                </div>

                {/* Title */}

                <h3 className="text-xl sm:text-3xl font-black text-slate-100 text-center">
                  Your Garage is Empty
                </h3>

                {/* Description */}

                <p className="mt-3 max-w-md text-center text-sm sm:text-base leading-relaxed text-slate-300">
                  Add your first vehicle to start booking washes, track service
                  history, and manage all your vehicles from one place.
                </p>

                {/* CTA */}

                <Button
                  onClick={() => setShowModal(true)}
                  className="
          mt-8
          h-11
          rounded-xl
          bg-gradient-to-r
          from-cyan-500
          to-blue-600
          px-6
          font-semibold
          text-white
          shadow-lg
          shadow-cyan-500/20
          hover:from-cyan-600
          hover:to-blue-700
        "
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Vehicle
                </Button>

                {/* Footer Hint */}

                <p className="mt-5 text-xs sm:text-sm text-slate-500">
                  It only takes a few seconds.
                </p>
              </CardContent>
            </Card>
          )}

          {/* VEHICLES */}
          {/* VEHICLES */}

          {!loading && filteredVehicles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-5">
              {filteredVehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
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
          transition-all
          duration-300
          hover:border-cyan-500/20
          hover:shadow-xl
          hover:shadow-cyan-500/10
        "
                >
                  {/* Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_45%)]" />

                  {/* Top Highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                  <CardContent className="relative p-4 sm:p-5">
                    {/* Header */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="
                  h-12
                  w-12
                  rounded-2xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
                        >
                          <Car className="h-6 w-6 text-cyan-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[2px] text-slate-400">
                            Registration
                          </p>

                          <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-100 truncate">
                            {vehicle.plate_number}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingVehicle(vehicle);
                            setPlate(vehicle.plate_number);
                            setVehicleType(vehicle.type);
                            setColor(vehicle.color);
                            setShowModal(true);
                          }}
                          className="
                  h-9
                  w-9
                  rounded-xl
                  border
                  border-cyan-500/15
                  bg-cyan-500/5
                  hover:bg-cyan-500/10
                "
                        >
                          <Edit className="h-4 w-4 text-cyan-400" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteVehicle(vehicle.id)}
                          className="
                  h-9
                  w-9
                  rounded-xl
                  border
                  border-red-500/15
                  bg-red-500/5
                  hover:bg-red-500/10
                "
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Vehicle Details */}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">
                          Type
                        </p>

                        <h4 className="mt-1 text-sm sm:text-base font-semibold text-slate-200">
                          {vehicle.type}
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">
                          Colour
                        </p>

                        <h4 className="mt-1 text-sm sm:text-base font-semibold text-slate-200">
                          {vehicle.color}
                        </h4>
                      </div>
                    </div>

                    {/* Footer */}

                    <div className="mt-5 flex items-center justify-between rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />

                        <span className="text-xs sm:text-sm text-slate-300">
                          Registered Vehicle
                        </span>
                      </div>

                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] sm:text-xs font-semibold text-cyan-400">
                        Active
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SUMMARY PANEL */}

        <div>
          <Card
            className="
      relative
      sticky
      top-6
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
            {/* Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_45%)]" />

            {/* Top Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

            <CardContent className="relative p-5 lg:p-6">
              {/* Header */}

              <div className="flex items-center gap-3 mb-6">
                <div
                  className="
            h-12
            w-12
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            flex
            items-center
            justify-center
          "
                >
                  <Car className="h-6 w-6 text-cyan-400" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[3px] text-cyan-400 font-semibold">
                    Garage
                  </p>

                  <h2 className="text-2xl font-black text-slate-100">
                    Summary
                  </h2>
                </div>
              </div>

              {/* Stats */}

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Registered
                      </p>

                      <h3 className="mt-1 text-3xl font-black text-cyan-400">
                        {vehicles.length}
                      </h3>
                    </div>

                    <div className="h-11 w-11 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center">
                      <Car className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Types
                    </p>

                    <h4 className="mt-2 text-2xl font-black text-slate-200">
                      {new Set(vehicles.map((v) => v.type)).size}
                    </h4>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Colours
                    </p>

                    <h4 className="mt-2 text-2xl font-black text-slate-200">
                      {new Set(vehicles.map((v) => v.color)).size}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Divider */}

              <div className="my-6 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              {/* CTA */}

              <Button
                onClick={() => setShowModal(true)}
                className="
          h-12
          w-full
          rounded-xl
          bg-gradient-to-r
          from-cyan-500
          to-blue-600
          font-semibold
          text-white
          shadow-lg
          shadow-cyan-500/20
          hover:from-cyan-600
          hover:to-blue-700
        "
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Vehicle
              </Button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Keep your garage up to date for faster bookings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <VehicleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        plate={plate}
        setPlate={setPlate}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        color={color}
        setColor={setColor}
        phone={phone}
        setPhone={setPhone}
        requiresPhone={requiresPhone}
        loading={saving}
        message={message}
        messageType={messageType}
        onSubmit={addVehicle}
      />
    </div>
  );
}
