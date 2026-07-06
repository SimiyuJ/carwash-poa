"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";
import { useRouter } from "next/navigation";

import {
  Car,
  Calendar,
  Clock3,
  Sparkles,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  carwash_id: string;

  service_prices: {
    vehicle_type_id: string;
    price: number;
  }[];
};


export default function BookingPage() {

  const {
    activeBranch,
    isReady,
  } = useActiveBranch();

  const [loading, setLoading] = useState(true);

  const [vehicles, setVehicles] = useState<any[]>([]);

  const [services, setServices] =
    useState<Service[]>([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState<any>(null);

  const [selectedService, setSelectedService] =
    useState<any>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [vehicle, setVehicle] =
    useState("");

  const [plate, setPlate] =
    useState("");

  const [vehicleColor, setVehicleColor] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const router = useRouter();

  const [customerId, setCustomerId] =
    useState<string | null>(null);

  const [selectedPrice, setSelectedPrice] =
    useState<number>(0);

  const [appointments, setAppointments] = useState<any[]>([]);

  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  const loadData = async () => {
    try {
      if (!activeBranch?.id) return;

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
        .single();

      if (customerError || !customer) {
        setVehicles([]);
        return;
      }

      setCustomerId(customer.id);

      const { data: vehicleTypesData } = await supabase
        .from("vehicle_types")
        .select("*");

      setVehicleTypes(vehicleTypesData || []);

      const {
        data: vehiclesData,
        error: vehiclesError,
      } = await supabase
        .from("vehicles")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("branch_id", activeBranch.id)
        .order("created_at", {
          ascending: false,
        });

      if (vehiclesError) {
        console.error(vehiclesError);
        return;
      }

      const {
        data: servicesData,
        error,
      } = await supabase
        .from("services")
        .select(`
        id,
        name,
        description,
        duration_minutes,
        carwash_id,
        service_prices(
          vehicle_type_id,
          price
        )
      `)
        .eq("branch_id", activeBranch.id)
        .eq("status", "active");

      if (error) {
        console.error(error);
        return;
      }

      setVehicles(vehiclesData || []);
      setServices(servicesData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeBranch?.id) return;

    setVehicles([]);
    setServices([]);
    setSelectedVehicle(null);
    setSelectedService(null);

    loadData();
  }, [activeBranch?.id]);

  const createBooking = async () => {
    try {
      if (
        !selectedService ||
        !date ||
        !time
      ) {
        alert("Complete booking details");
        return;
      }

      const { data: existing } =
        await supabase
          .from("appointments")
          .select("id")
          .eq("branch_id", activeBranch?.id)
          .eq("appointment_date", date)
          .eq("appointment_time", time);

      if (existing?.length) {
        alert("Time slot already booked");
        return;
      }

      if (!customerId) {
        alert("Customer not found");
        return;
      }

      const { error } =
        await supabase
          .from("appointments")
          .insert({
            customer_id: customerId,

            customer: customerName,
            phone,
            email,

            vehicle,
            plate,

            vehicle_color: vehicleColor,

            service: selectedService.name,

            appointment_date: date,
            appointment_time: time,

            estimated_duration:
              selectedService.duration_minutes,

            notes,

            status: "pending",

            priority: "normal",

            branch_id: activeBranch?.id,
            branch_name: activeBranch?.name,

            carwash_id:
              selectedService.carwash_id,
          });

      if (error) throw error;

      alert("Booking created");

      router.push(
        "/customer/bookings"
      );
    } catch (error) {
      console.error(error);
      alert(
        "Failed to create booking"
      );
    }
  };

  const loadAppointments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!customer) return;

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("customer_id", customer.id)
        .order("appointment_date", {
          ascending: false,
        });

      if (error) throw error;

      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-500/15 text-emerald-400";

      case "in_progress":
        return "bg-cyan-500/15 text-cyan-400";

      case "cancelled":
        return "bg-red-500/15 text-red-400";

      default:
        return "bg-amber-500/15 text-amber-400";
    }
  };


  const getVehicleTypeId = (vehicleName: string) => {
    return vehicleTypes.find(
      (v) =>
        v.name.toLowerCase() ===
        vehicleName?.toLowerCase()
    )?.id;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

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
              Appointment Booking
            </p>

            <h1 className="text-5xl font-black mt-2">
              Book Your Wash
            </h1>

            <p className="text-slate-400 mt-3 text-lg">
              Schedule a professional wash at{" "}
              <span className="text-cyan-400">
                {activeBranch?.name}
              </span>
            </p>
          </div>

          <div
            className="
            h-24
            w-24
            rounded-[28px]
            bg-cyan-500/10
            border border-cyan-500/20
            flex items-center justify-center
          "
          >
            <Calendar className="h-12 w-12 text-cyan-400" />
          </div>

        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_420px] gap-6">

        {/* LEFT SIDE */}
        <div className="space-y-6">

          {/* VEHICLES */}
          <Card
            className="
            rounded-[32px]
            border border-[#1A2D4D]
            bg-[#07142B]
            text-white"
          >
            <CardContent className="p-7">

              <div className="flex items-center gap-3 mb-6">
                <Car className="h-6 w-6 text-cyan-400" />

                <h2 className="text-2xl font-bold">
                  Choose Vehicle
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => {


                      setSelectedVehicle(vehicle);

                      setVehicle(vehicle.type);
                      setPlate(vehicle.plate_number);
                      setVehicleColor(vehicle.color);
                    }}
                    className={`
                      text-left
                      rounded-[24px]
                      border
                      p-5
                      text-white
                      
                      ${selectedVehicle?.id === vehicle.id
                        ? `
      border-cyan-400
      bg-cyan-500/15
      shadow-[0_0_30px_rgba(6,182,212,0.25)]
    `
                        : `
      border-[#1A2D4D]
      bg-[#091A34]
      hover:border-cyan-500/30
    `
                      }
                      `}
                  >
                    <div className="flex justify-between">

                      <div>
                        <h3 className="font-bold text-lg text-white">
                          {vehicle.plate_number}
                        </h3>

                        <p className="text-white/70">
                          {vehicle.type || "Vehicle"}
                        </p>

                        <p className="text-cyan-400 text-sm mt-1">
                          {vehicle.color}
                        </p>
                      </div>

                      {selectedVehicle?.id === vehicle.id && (
                        <CheckCircle2 className="text-cyan-400" />
                      )}

                    </div>
                  </button>
                ))}

              </div>

            </CardContent>
          </Card>

          {/* SERVICES */}
          <Card className="rounded-[32px] border border-[#1A2D4D] bg-[#07142B]">
            <CardContent className="p-7">

              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-6 w-6 text-cyan-400" />

                <h2 className="text-2xl font-bold text-white">
                  Select Service Package
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                {!selectedVehicle ? (
                  <div className="col-span-2 text-center py-10 text-slate-400">
                    Select a vehicle first
                  </div>
                ) : (
                  services.map((service) => {

                    const vehicleTypeId = getVehicleTypeId(
                      selectedVehicle?.type
                    );

                    const vehiclePrice =
                      service.service_prices?.find(
                        (p) =>
                          p.vehicle_type_id === vehicleTypeId
                      );

                    if (!vehiclePrice) return null;

                    console.log(
                      "Selected Vehicle:",
                      selectedVehicle
                    );

                    console.log(
                      "Services:",
                      services
                    );

                    return (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);

                          const vehicleTypeId = getVehicleTypeId(
                            selectedVehicle?.type
                          );

                          const vehiclePrice =
                            service.service_prices?.find(
                              (p) =>
                                p.vehicle_type_id === vehicleTypeId
                            );

                          setSelectedPrice(vehiclePrice?.price || 0);
                        }}
                        className={`
                    text-left
                    rounded-[24px]
                    border
                    p-6
                    transition-all

                    ${selectedService?.id === service.id
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-white/10 bg-white/[0.02]"
                          }
                  `}
                      >
                        <div className="flex justify-between items-start">

                          <div>
                            <h3 className="font-bold text-xl text-white">
                              {service.name}
                            </h3>

                            <p className="text-slate-400 mt-2">
                              {service.description}
                            </p>
                          </div>

                          {selectedService?.id === service.id && (
                            <CheckCircle2 className="text-cyan-400" />
                          )}

                        </div>

                        <div className="mt-6 flex items-center justify-between">

                          <div>
                            <p className="text-slate-500 text-sm">
                              Starting From
                            </p>

                            <p className="text-cyan-400 font-black text-3xl">
                              KES {vehiclePrice.price.toLocaleString()}
                            </p>
                          </div>

                          <div
                            className="
                        px-4 py-2
                        rounded-full
                        bg-white/5
                        border border-white/10
                      "
                          >
                            {service.duration_minutes} mins
                          </div>

                        </div>
                      </button>
                    );
                  })
                )}
              </div>

            </CardContent>
          </Card>

          {/* DATE + TIME */}
          <Card className="rounded-[32px] border border-[#1A2D4D] bg-[#07142B]">
            <CardContent className="p-7">

              <h2 className="text-2xl font-bold mb-6">
                Select Date & Time
              </h2>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="
                w-full
                h-16
                rounded-2xl
                bg-slate-900
                border border-white/10
                px-5
                text-white
              "
              />

              <div className="grid grid-cols-4 gap-3 mt-5">

                {[
                  "08:00",
                  "09:00",
                  "10:00",
                  "11:00",
                  "12:00",
                  "13:00",
                  "14:00",
                  "15:00",
                ].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`
                    h-14
                    rounded-2xl
                    border
                    flex
                    items-center
                    justify-center
                    gap-2
                    transition-all

                    ${time === slot
                        ? "bg-cyan-500 text-white border-cyan-500"
                        : "bg-slate-900 border-white/10 text-slate-300"
                      }
                  `}
                  >
                    <Clock3 size={16} />
                    {slot}
                  </button>
                ))}

              </div>

            </CardContent>
          </Card>

        </div>

        {/* SUMMARY */}
        <div>

          <Card
            className="
            sticky top-6
            rounded-[32px]
            border border-cyan-500/20
            bg-[#07142B]
          "
          >
            <CardContent className="p-7">

              <h2 className="text-3xl font-black mb-8">
                Booking Summary
              </h2>

              <div className="space-y-6">

                <div>
                  <p className="text-slate-500">
                    Vehicle
                  </p>

                  <p className="font-semibold text-lg text-white">
                    {selectedVehicle?.plate_number || "Select vehicle"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Service
                  </p>

                  <p className="font-semibold text-lg">
                    {selectedService?.name ||
                      "Select service"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Schedule
                  </p>

                  <p className="font-semibold">
                    {date || "--"} • {time || "--"}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">

                  <p className="text-slate-500">
                    Total Price
                  </p>

                  <h3 className="text-5xl font-black text-cyan-400 mt-2">
                    KES{" "}
                    {
                      selectedService?.service_prices?.find(
                        (p: any) =>
                          p.vehicle_type_id === selectedVehicle?.vehicle_type_id
                      )?.price || 0
                    }
                  </h3>

                </div>

              </div>

              <Button
                onClick={createBooking}
                disabled={saving}
                className="
                mt-8
                h-16
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
                text-lg
                font-bold
              "
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />

                {saving
                  ? "Creating Booking..."
                  : "Confirm Booking"}
              </Button>

            </CardContent>
          </Card>

        </div>

      </div>



      <div className="mt-10">
        <h2 className="text-3xl font-black text-white mb-6">
          My Bookings
        </h2>

        <div className="grid gap-6">
          {appointments.map((booking) => (
            <Card
              key={booking.id}
              className="
          rounded-[32px]
          border border-[#1A2D4D]
          bg-[#07142B]
          text-white
        "
            >
              <CardContent className="p-8">
                <div className="border-t border-white/10 my-8" />

                <div className="grid md:grid-cols-2 gap-5">

                  <div className="rounded-3xl border border-white/10 p-5">
                    <p className="text-slate-500 uppercase tracking-[4px] text-sm">
                      Vehicle
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                      {booking.vehicle}
                    </h3>

                    <p className="text-slate-400">
                      {booking.plate}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 p-5">
                    <p className="text-slate-500 uppercase tracking-[4px] text-sm">
                      Phone
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                      {booking.phone}
                    </h3>
                  </div>

                  <div className="rounded-3xl border border-white/10 p-5">
                    <p className="text-slate-500 uppercase tracking-[4px] text-sm">
                      Schedule
                    </p>

                    <h3 className="text-xl font-bold mt-2">
                      {booking.appointment_date}
                    </h3>

                    <p className="text-slate-400">
                      {booking.appointment_time}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 p-5">
                    <p className="text-slate-500 uppercase tracking-[4px] text-sm">
                      Branch
                    </p>

                    <h3 className="text-xl font-bold mt-2">
                      {booking.branch_name}
                    </h3>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>

  );
}