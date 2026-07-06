"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VehicleModal from "@/components/vehicles/VehicleModal";
import {
  useActiveBranch,
} from "@/components/providers/ActiveBranchProvider";


import {
  Car,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";


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
  const [vehicleType, setVehicleType] =
    useState("Sedan");

  const {
    activeBranch,
  } = useActiveBranch();

  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null);

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
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");
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

      const {
        data: customer,
        error: customerError,
      } = await supabase
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
      [
        vehicle.plate_number,
        vehicle.type,
        vehicle.color,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [vehicles, search]);

  const addVehicle = async () => {
    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;


      const { data: customer, error: customerError } =
        await supabase
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
        .select(`
          id,
          customer_id
          `)
        .eq("customer_id", customer.id)
        .eq("branch_id", activeBranch?.id)
        .eq("plate_number", cleanPlate)
        .maybeSingle();

      if (
        existingVehicle &&
        existingVehicle.customer_id === user.id
      ) {
        // update
      }
      else if (existingVehicle) {
        throw new Error(
          "This vehicle is already registered to another account"
        );
      }

      if (existingVehicle) {
        const { error: updateError } =
          await supabase
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

      const { error } = await supabase
        .from("vehicles")
        .insert({
          customer_id: customer.id,
          profile_id: user.id,
          plate_number: cleanPlate,
          type: vehicleType,
          color,
          branch_id: activeBranch?.id,
          carwash_id: activeBranch?.carwashId,
        })

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
    const confirmed = window.confirm(
      "Delete this vehicle?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    setVehicles((prev) =>
      prev.filter((v) => v.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* HERO */}
      <div
        className="
      mb-8
      rounded-[32px]
      border border-[#1A2D4D]
      bg-gradient-to-r
      from-[#07142B]
      via-[#0A1D3D]
      to-[#07142B]
      p-8
    "
      >
        <div className="flex items-center justify-between">

          <div>

            <p className="text-cyan-400 font-semibold uppercase tracking-[4px]">
              My Garage
            </p>

            <h1 className="text-5xl font-black mt-2">
              Your Vehicles
            </h1>

            <p className="text-slate-400 mt-3 text-lg">
              Manage all vehicles linked to your account.
            </p>

          </div>

          <div className="flex gap-3">

            <Button
              variant="outline"
              onClick={fetchVehicles}
              className="
            border-white/10
            bg-white/5
            text-white
            hover:bg-white/10
          "
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              onClick={() => setShowModal(true)}
              className="
            bg-gradient-to-r
            from-cyan-500
            to-blue-600
            hover:from-cyan-600
            hover:to-blue-700
          "
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>

          </div>

        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_360px] gap-6">

        {/* LEFT SIDE */}
        <div className="space-y-6">

          {/* SEARCH */}
          <Card className="rounded-[28px] border border-[#1A2D4D] bg-[#07142B]">
            <CardContent className="p-5">

              <div className="relative">

                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search vehicle registration..."
                  className="
                  h-14
                  w-full
                  rounded-2xl
                  border border-white/10
                  bg-[#091A34]
                  pl-12
                  pr-4
                  text-white
                  outline-none
                  focus:border-cyan-500
                "
                />

              </div>

            </CardContent>

          </Card>



          {/* EMPTY */}
          {!loading &&
            filteredVehicles.length === 0 && (
              <Card className="rounded-[28px] border border-[#1A2D4D] bg-[#07142B]">

                <CardContent className="py-24 text-center">

                  <Car className="mx-auto h-16 w-16 text-cyan-400 mb-4" />

                  <h3 className="text-2xl font-bold">
                    No Vehicles Yet
                  </h3>

                  <p className="text-slate-400 mt-2">
                    Add your first vehicle to begin booking washes.
                  </p>

                  <Button
                    onClick={() =>
                      setShowModal(true)
                    }
                    className="mt-6"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Button>

                </CardContent>

              </Card>
            )}

          {/* VEHICLES */}
          {!loading &&
            filteredVehicles.length > 0 && (
              <div className="grid md:grid-cols-2 gap-5">

                {filteredVehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    className="
      rounded-[28px]
      border border-[#1A2D4D]
      bg-[#07142B]
    "
                  >
                    <CardContent className="p-6">

                      <div className="flex justify-between items-start">

                        <div>
                          <p className="text-slate-500 text-xs uppercase">
                            Registration
                          </p>

                          <h3 className="text-3xl font-black mt-1">
                            {vehicle.plate_number}
                          </h3>
                        </div>

                        <div className="flex gap-2">

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
                          >
                            <Edit className="h-4 w-4 text-cyan-400" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteVehicle(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>

                        </div>

                      </div>

                      <div className="flex gap-3 mt-6">

                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                          {vehicle.type}
                        </div>

                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                          {vehicle.color}
                        </div>

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
          sticky
          top-6
          rounded-[28px]
          border border-cyan-500/20
          bg-[#07142B]
        "
          >
            <CardContent className="p-7">

              <h2 className="text-3xl font-black mb-8">
                Garage Summary
              </h2>

              <div className="space-y-6">

                <div>
                  <p className="text-slate-500">
                    Registered Vehicles
                  </p>

                  <p className="text-4xl font-black text-cyan-400">
                    {vehicles.length}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Vehicle Types
                  </p>

                  <p className="text-xl font-semibold">
                    {
                      new Set(
                        vehicles.map(
                          (v) => v.type
                        )
                      ).size
                    }
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Colors
                  </p>

                  <p className="text-xl font-semibold">
                    {
                      new Set(
                        vehicles.map(
                          (v) => v.color
                        )
                      ).size
                    }
                  </p>
                </div>

              </div>

              <Button
                onClick={() =>
                  setShowModal(true)
                }
                className="
              mt-8
              w-full
              h-14
              bg-gradient-to-r
              from-cyan-500
              to-blue-600
              text-lg
              font-bold
            "
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Vehicle
              </Button>

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