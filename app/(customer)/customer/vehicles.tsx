"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Car, Plus } from "lucide-react";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [plateNumber, setPlateNumber] = useState("");
  const [model, setModel] = useState("");
  const [search, setSearch] = useState("");

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    // Get logged-in user safely
    const { data: userData } = await supabase.auth.getUser();
    const id = userData.user?.id;

    if (!id) {
      console.warn("No logged-in user found");
      setLoading(false);
      return;
    }

    setUserId(id);

    // Fetch vehicles for this customer only
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Vehicle fetch error:", error.message);
      setVehicles([]);
    } else {
      setVehicles(data || []);
    }

    setLoading(false);
  };

  const addVehicle = async () => {
    if (!userId) return;
    if (!plateNumber.trim()) return;

    const { error } = await supabase.from("vehicles").insert([
      {
        user_id: userId,
        plate_number: plateNumber,
        model: model,
      },
    ]);

    if (error) {
      console.error("Add vehicle error:", error.message);
      return;
    }

    setPlateNumber("");
    setModel("");

    init(); // refresh list
  };

  const filtered = vehicles.filter((v) =>
    v.plate_number?.toLowerCase().includes(search.toLowerCase())
  );

  // SAFE LOADING STATE
  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Loading vehicles...
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Car size={20} />
          My Vehicles
        </h1>

        <p className="text-sm text-gray-500">
          Manage your registered vehicles
        </p>
      </div>

      {/* ADD VEHICLE */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">

          <Input
            placeholder="Plate Number (e.g KDA 123A)"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
          />

          <Input
            placeholder="Car Model (e.g Toyota Corolla)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />

          <Button onClick={addVehicle} className="w-full">
            <Plus size={16} className="mr-2" />
            Add Vehicle
          </Button>

        </CardContent>
      </Card>

      {/* SEARCH */}
      <div className="mb-4">
        <Input
          placeholder="Search by plate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">
          No vehicles found. Add your first vehicle.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <h2 className="font-bold">
                  {vehicle.plate_number}
                </h2>

                <p className="text-sm text-gray-500">
                  {vehicle.model || "No model"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}