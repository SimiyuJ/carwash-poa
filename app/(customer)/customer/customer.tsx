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
  const [type, setType] = useState("");
  const [color, setColor] = useState("");

  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const id = userData.user?.id;

    if (!id) {
      console.warn("No logged-in customer");
      setLoading(false);
      return;
    }

    setCustomerId(id);

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", id)
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
    if (!customerId) return;
    if (!plateNumber) return;

    const { error } = await supabase.from("vehicles").insert([
      {
        customer_id: customerId,
        plate_number: plateNumber,
        type: type,
        color: color,
      },
    ]);

    if (error) {
      console.error("Add vehicle error:", error.message);
      return;
    }

    setPlateNumber("");
    setType("");
    setColor("");

    init();
  };

  const filtered = vehicles.filter((v) =>
    v.plate_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-gray-500">Loading vehicles...</div>;
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
            placeholder="Plate Number"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
          />

          <Input
            placeholder="Type (e.g Sedan, Prado)"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <Input
            placeholder="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
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
          placeholder="Search plate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">No vehicles found</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4">
                <h2 className="font-bold">{v.plate_number}</h2>
                <p className="text-sm text-gray-500">
                  {v.type} • {v.color}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}