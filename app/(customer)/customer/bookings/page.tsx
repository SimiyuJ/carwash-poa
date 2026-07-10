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
  const { activeBranch, isReady } = useActiveBranch();

  const [loading, setLoading] = useState(true);

  const [vehicles, setVehicles] = useState<any[]>([]);

  const [services, setServices] = useState<Service[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const [selectedService, setSelectedService] = useState<any>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [customerName, setCustomerName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [vehicle, setVehicle] = useState("");

  const [plate, setPlate] = useState("");

  const [vehicleColor, setVehicleColor] = useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const [customerId, setCustomerId] = useState<string | null>(null);

  const [selectedPrice, setSelectedPrice] = useState<number>(0);

  const [appointments, setAppointments] = useState<any[]>([]);

  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"book" | "bookings">("book");

  const loadData = async () => {
    try {
      if (!activeBranch?.id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer, error: customerError } = await supabase
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

      const { data: vehiclesData, error: vehiclesError } = await supabase
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

      const { data: servicesData, error } = await supabase
        .from("services")
        .select(
          `
        id,
        name,
        description,
        duration_minutes,
        carwash_id,
        service_prices(
          vehicle_type_id,
          price
        )
      `,
        )
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
      if (!selectedService || !date || !time) {
        alert("Complete booking details");
        return;
      }

      const { data: existing } = await supabase
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

      const { error } = await supabase.from("appointments").insert({
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

        estimated_duration: selectedService.duration_minutes,

        notes,

        status: "pending",

        priority: "normal",

        branch_id: activeBranch?.id,
        branch_name: activeBranch?.name,

        carwash_id: selectedService.carwash_id,
      });

      if (error) throw error;

      alert("Booking created");

      router.push("/customer/bookings");
    } catch (error) {
      console.error(error);
      alert("Failed to create booking");
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
      (v) => v.name.toLowerCase() === vehicleName?.toLowerCase(),
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
    <div
      className="
    min-h-screen

    bg-gradient-to-br
    from-[#07142B]
    via-[#081A33]
    to-[#07142B]

    text-slate-100

    px-3
    py-4

    sm:px-4
    sm:py-5

    lg:px-6
    lg:py-6
  "
    >
      <div
        className="
      mx-auto
      w-full
      max-w-7xl

      space-y-5
      lg:space-y-6
    "
      >
        {/* =========================================================
    HERO
========================================================= */}

        <div
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

    shadow-[0_10px_50px_rgba(0,0,0,.25)]
  "
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_45%)]" />

          {/* Top Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}

              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className="
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center

            rounded-2xl

            border border-cyan-500/20

            bg-cyan-500/10
          "
                >
                  <Calendar className="h-7 w-7 text-cyan-400" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[4px] font-semibold text-cyan-400">
                    Appointment Booking
                  </p>

                  <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100">
                    Book Your Wash
                  </h1>

                  <p className="mt-3 max-w-xl text-slate-300 leading-relaxed">
                    Reserve your preferred wash service at
                    <span className="text-cyan-400 font-semibold">
                      {" "}
                      {activeBranch?.name}
                    </span>{" "}
                    in just a few steps.
                  </p>
                </div>
              </div>

              {/* RIGHT */}

              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                {/* Vehicles */}

                <div
                  className="
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-5
            py-4
            backdrop-blur-xl
          "
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Vehicles
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-cyan-400">
                    {vehicles.length}
                  </h2>
                </div>

                {/* Services */}

                <div
                  className="
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-5
            py-4
            backdrop-blur-xl
          "
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Services
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-cyan-400">
                    {services.length}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOOKING NAVIGATION */}

        <div className="sticky top-2 z-20 mb-6">
          <div
            className="
            flex
            gap-2
            overflow-x-auto
            rounded-2xl
            border border-cyan-500/10
            bg-[#07142B]/90
            backdrop-blur-xl
            p-2
            "
          >
            <Button
              onClick={() => setActiveTab("bookings")}
              className={
                activeTab === "bookings"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl"
              }
            >
              <Car className="mr-2 h-4 w-4" />
              My Bookings
            </Button>

            <Button
              onClick={() => setActiveTab("book")}
              className={
                activeTab === "book"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl"
              }
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book Wash
            </Button>
          </div>
        </div>

        {/* =========================================================
    MY BOOKINGS
========================================================= */}

        {activeTab === "bookings" && (
          <section className="space-y-6">
            {/* SECTION HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-cyan-400">
                  BOOKINGS
                </p>

                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-100">
                  My Bookings
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Track your upcoming appointments and review previous bookings.
                </p>
              </div>

              <div
                className="
          hidden
          lg:flex
          items-center
          gap-3

          rounded-2xl

          border border-cyan-500/10
          bg-cyan-500/5

          px-5
          py-3
        "
              >
                <Calendar className="h-5 w-5 text-cyan-400" />

                <div>
                  <p className="text-xs uppercase text-slate-500">
                    Total Bookings
                  </p>

                  <p className="font-semibold text-slate-100">
                    {appointments.length}
                  </p>
                </div>
              </div>
            </div>

            {/* EMPTY STATE */}

            {appointments.length === 0 ? (
              <Card
                className="
          rounded-[30px]

          border border-cyan-500/10

          bg-gradient-to-br
          from-[#07142B]
          via-[#0A1D3D]
          to-[#07142B]
        "
              >
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div
                    className="
              flex
              h-20
              w-20
              items-center
              justify-center

              rounded-3xl

              border border-cyan-500/20
              bg-cyan-500/10
            "
                  >
                    <Calendar className="h-10 w-10 text-cyan-400" />
                  </div>

                  <h2 className="mt-6 text-3xl font-bold text-slate-100">
                    No Bookings Yet
                  </h2>

                  <p className="mt-3 max-w-lg text-slate-300 leading-relaxed">
                    You haven't scheduled a wash yet. Book your first
                    appointment and manage all upcoming services from this page.
                  </p>

                  <Button
                    onClick={() => setActiveTab("book")}
                    className="
              mt-8

              rounded-2xl

              bg-gradient-to-r
              from-cyan-500
              to-blue-600

              px-8
              h-12
            "
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Book a Wash
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-5">
                {appointments.map((booking) => (
                  <Card
                    key={booking.id}
                    className="
              group
              relative
              overflow-hidden

              rounded-[30px]

              border border-cyan-500/10

              bg-gradient-to-br
              from-[#07142B]
              via-[#0A1D3D]
              to-[#07142B]

              transition-all
              duration-300

              hover:border-cyan-400/30
              hover:shadow-[0_18px_40px_rgba(34,211,238,.12)]
            "
                  >
                    {/* Glow */}

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_45%)] opacity-0 group-hover:opacity-100 transition" />

                    <CardContent className="relative p-6">
                      {/* HEADER */}

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
                            <Calendar className="h-3 w-3 text-cyan-400" />

                            <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                              Appointment
                            </span>
                          </div>

                          <h2 className="mt-3 text-2xl font-bold text-slate-100">
                            {booking.service}
                          </h2>

                          <p className="mt-1 text-slate-400">
                            {booking.branch_name}
                          </p>
                        </div>

                        <div
                          className={`
                    px-4
                    py-2
                    rounded-full
                    text-sm
                    font-semibold

                    ${getStatusColor(booking.status)}
                  `}
                        >
                          {booking.status}
                        </div>
                      </div>

                      {/* DETAILS */}

                      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase text-slate-500">
                            Vehicle
                          </p>

                          <h3 className="mt-2 font-semibold text-slate-100">
                            {booking.vehicle}
                          </h3>

                          <p className="mt-1 text-sm text-cyan-300">
                            {booking.plate}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase text-slate-500">
                            Schedule
                          </p>

                          <h3 className="mt-2 font-semibold text-slate-100">
                            {booking.appointment_date}
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {booking.appointment_time}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase text-slate-500">
                            Phone
                          </p>

                          <h3 className="mt-2 font-semibold text-slate-100">
                            {booking.phone}
                          </h3>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase text-slate-500">
                            Branch
                          </p>

                          <h3 className="mt-2 font-semibold text-slate-100">
                            {booking.branch_name}
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "book" && (
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

                    <h2 className="text-2xl font-bold">Choose Vehicle</h2>
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
                      
                      ${
                        selectedVehicle?.id === vehicle.id
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
                          selectedVehicle?.type,
                        );

                        const vehiclePrice = service.service_prices?.find(
                          (p) => p.vehicle_type_id === vehicleTypeId,
                        );

                        if (!vehiclePrice) return null;

                        return (
                          <button
                            key={service.id}
                            onClick={() => {
                              setSelectedService(service);

                              const vehicleTypeId = getVehicleTypeId(
                                selectedVehicle?.type,
                              );

                              const vehiclePrice = service.service_prices?.find(
                                (p) => p.vehicle_type_id === vehicleTypeId,
                              );

                              setSelectedPrice(vehiclePrice?.price || 0);
                            }}
                            className={`
                    text-left
                    rounded-[24px]
                    border
                    p-6
                    transition-all

                    ${
                      selectedService?.id === service.id
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
                    onChange={(e) => setDate(e.target.value)}
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

                    ${
                      time === slot
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
                  <h2 className="text-3xl font-black mb-8">Booking Summary</h2>

                  <div className="space-y-6">
                    <div>
                      <p className="text-slate-500">Vehicle</p>

                      <p className="font-semibold text-lg text-white">
                        {selectedVehicle?.plate_number || "Select vehicle"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Service</p>

                      <p className="font-semibold text-lg">
                        {selectedService?.name || "Select service"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Schedule</p>

                      <p className="font-semibold">
                        {date || "--"} • {time || "--"}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <p className="text-slate-500">Total Price</p>

                      <h3 className="text-5xl font-black text-cyan-400 mt-2">
                        KES{" "}
                        {selectedService?.service_prices?.find(
                          (p: any) =>
                            p.vehicle_type_id ===
                            selectedVehicle?.vehicle_type_id,
                        )?.price || 0}
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

                    {saving ? "Creating Booking..." : "Confirm Booking"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
