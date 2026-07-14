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
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Receipt,
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
          <div
            className="
            relative
            grid
            grid-cols-1
            gap-6
            xl:grid-cols-[minmax(0,1fr)_420px]
            2xl:grid-cols-[minmax(0,1fr)_450px]
            items-start
            
            "
          >
            {/* =========================
            LEFT CONTENT
            ========================== */}

            <div
              className="
              flex
              flex-col
              gap-6
              min-w-0
              "
            >
              {/* ================= VEHICLE SELECTION ================= */}

              <Card
                className="
    overflow-hidden
    rounded-[32px]
    border
    border-cyan-500/15
    bg-gradient-to-br
    from-[#07182F]
    via-[#091D39]
    to-[#061223]
    shadow-[0_25px_70px_rgba(0,0,0,.45)]
  "
              >
                <CardContent className="p-0">
                  {/* =========================================================
        HEADER
    ========================================================= */}

                  <div className="relative overflow-hidden border-b border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent" />

                    <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-3xl
              bg-gradient-to-br
              from-cyan-500
              to-blue-600
              shadow-lg
              shadow-cyan-500/25
            "
                        >
                          <Car className="h-7 w-7 text-white" />
                        </div>

                        <div>
                          <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            Step 1 of 4
                          </span>

                          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white">
                            Choose Your Vehicle
                          </h2>

                          <p className="mt-2 text-sm text-slate-400">
                            Select the vehicle you'd like us to wash today.
                          </p>
                        </div>
                      </div>

                      <div className="self-start rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Registered
                        </p>

                        <p className="mt-1 text-xl font-black text-cyan-400">
                          {vehicles.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =========================================================
        BODY
    ========================================================= */}

                  <div className="p-4 sm:p-6">
                    {vehicles.length === 0 ? (
                      <div className="rounded-[28px] border border-dashed border-cyan-500/20 bg-cyan-500/[0.03] px-6 py-14 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
                          <Car className="h-10 w-10 text-cyan-400" />
                        </div>

                        <h3 className="mt-6 text-2xl font-bold text-white">
                          No Vehicles Found
                        </h3>

                        <p className="mt-2 text-slate-400">
                          Add your first vehicle to continue your booking.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {vehicles.map((vehicle) => {
                          const active = selectedVehicle?.id === vehicle.id;

                          return (
                            <button
                              key={vehicle.id}
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setVehicle(vehicle.type);
                                setPlate(vehicle.plate_number);
                                setVehicleColor(vehicle.color);
                              }}
                              className={`
                  group
                  relative
                  overflow-hidden
                  rounded-[28px]
                  border
                  p-4
                  text-left
                  transition-all
                  duration-300
                  ${
                    active
                      ? `
                        scale-[1.02]
                        border-cyan-400
                        bg-gradient-to-br
                        from-cyan-500/15
                        to-blue-500/10
                        shadow-[0_0_45px_rgba(34,211,238,.25)]
                      `
                      : `
                        border-white/10
                        bg-white/[0.03]
                        hover:border-cyan-400/30
                        hover:bg-white/[0.05]
                      `
                  }
                `}
                            >
                              {/* Selected Badge */}

                              {active && (
                                <div className="absolute right-4 top-4">
                                  <div className="flex items-center gap-2 rounded-full bg-cyan-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Selected
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-4">
                                <div
                                  className={`
                      flex
                      h-16
                      w-16
                      shrink-0
                      items-center
                      justify-center
                      rounded-3xl
                      transition-all
                      ${
                        active
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                          : "bg-cyan-500/10 text-cyan-400"
                      }
                    `}
                                >
                                  <Car className="h-8 w-8" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    License Plate
                                  </p>

                                  <h3 className="mt-1 truncate text-2xl font-black text-white">
                                    {vehicle.plate_number}
                                  </h3>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                      {vehicle.type || "Vehicle"}
                                    </span>

                                    {vehicle.color && (
                                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                                        {vehicle.color}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-5 flex items-center justify-between">
                                    <span className="text-sm text-slate-400">
                                      Ready for booking
                                    </span>

                                    {active ? (
                                      <span className="font-semibold text-emerald-400">
                                        ✓ Selected
                                      </span>
                                    ) : (
                                      <span className="font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                                        Tap to Select →
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ================= SERVICE PACKAGES ================= */}

              <Card
                className="
    overflow-hidden

    rounded-[36px]

    border
    border-cyan-500/15

    bg-gradient-to-br
    from-[#081A33]
    via-[#091B37]
    to-[#07142B]

    shadow-[0_20px_60px_rgba(0,0,0,.35)]
  "
              >
                <CardContent className="p-0">
                  {/* HEADER */}

                  <div
                    className="
        border-b
        border-white/5

        bg-gradient-to-r
        from-cyan-500/10
        via-sky-500/5
        to-transparent

        p-7
      "
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="
              h-14
              w-14

              rounded-3xl

              border
              border-cyan-500/20

              bg-cyan-500/10

              flex
              items-center
              justify-center
            "
                        >
                          <Sparkles className="h-7 w-7 text-cyan-400" />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">
                            STEP 2
                          </p>

                          <h2 className="mt-1 text-3xl font-black text-white">
                            Choose Your Wash Package
                          </h2>

                          <p className="mt-1 text-slate-400">
                            Pick the perfect wash package for your vehicle.
                          </p>
                        </div>
                      </div>

                      {selectedVehicle && (
                        <div
                          className="
              rounded-2xl

              border
              border-cyan-500/15

              bg-cyan-500/5

              px-4
              py-2

              text-sm
              font-semibold

              text-cyan-300
            "
                        >
                          {selectedVehicle.plate_number}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BODY */}

                  <div className="p-7">
                    {!selectedVehicle ? (
                      <div
                        className="
            flex
            flex-col

            items-center
            justify-center

            rounded-[30px]

            border
            border-dashed
            border-cyan-500/20

            bg-cyan-500/[0.03]

            py-20

            text-center
          "
                      >
                        <Car className="h-12 w-12 text-cyan-400" />

                        <h3 className="mt-6 text-2xl font-bold text-white">
                          Select a Vehicle First
                        </h3>

                        <p className="mt-3 max-w-sm text-slate-400">
                          Your wash packages depend on the selected vehicle
                          type.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {services.map((service, index) => {
                          const vehicleTypeId = getVehicleTypeId(
                            selectedVehicle.type,
                          );

                          const vehiclePrice = service.service_prices?.find(
                            (p) => p.vehicle_type_id === vehicleTypeId,
                          );

                          if (!vehiclePrice) return null;

                          const active = selectedService?.id === service.id;

                          return (
                            <button
                              key={service.id}
                              onClick={() => {
                                setSelectedService(service);

                                setSelectedPrice(vehiclePrice.price);
                              }}
                              className={`
                  group
                  relative

                  overflow-hidden

                  rounded-[30px]

                  border

                  p-6

                  text-left

                  transition-all
                  duration-300

                  hover:-translate-y-1

                  ${
                    active
                      ? `
                        border-cyan-400

                        bg-gradient-to-br
                        from-cyan-500/15
                        to-sky-500/10

                        shadow-[0_0_40px_rgba(34,211,238,.20)]
                      `
                      : `
                        border-cyan-500/10

                        bg-[#0B1D38]

                        hover:border-cyan-500/30
                        hover:bg-[#10264A]
                      `
                  }
                `}
                            >
                              {index === 0 && (
                                <div
                                  className="
                      absolute
                      right-5
                      top-5

                      rounded-full

                      bg-gradient-to-r
                      from-cyan-500
                      to-sky-500

                      px-3
                      py-1

                      text-xs
                      font-bold
                      text-white
                    "
                                >
                                  Most Popular
                                </div>
                              )}

                              {active && (
                                <div
                                  className="
                      absolute
                      left-5
                      top-5

                      flex
                      items-center
                      gap-2

                      rounded-full

                      bg-emerald-500

                      px-3
                      py-1

                      text-xs
                      font-bold
                      text-white
                    "
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Selected
                                </div>
                              )}

                              <div className="pt-8">
                                <h3 className="text-2xl font-black text-white">
                                  {service.name}
                                </h3>

                                <p className="mt-3 text-slate-400 leading-relaxed">
                                  {service.description}
                                </p>

                                <div className="mt-8">
                                  <p className="text-xs uppercase tracking-widest text-slate-500">
                                    Starting From
                                  </p>

                                  <h2 className="mt-2 text-4xl font-black text-cyan-400">
                                    KES {vehiclePrice.price.toLocaleString()}
                                  </h2>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                  <div
                                    className="
                        rounded-full

                        border
                        border-cyan-500/20

                        bg-cyan-500/10

                        px-4
                        py-2

                        text-sm
                        font-semibold

                        text-cyan-300
                      "
                                  >
                                    {service.duration_minutes} mins
                                  </div>

                                  <div className="text-sm text-slate-500">
                                    Professional Care
                                  </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span className="text-slate-300">
                                      Premium cleaning products
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span className="text-slate-300">
                                      Professional wash team
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span className="text-slate-300">
                                      High-quality finish
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ================= SCHEDULE ================= */}

              <Card
                className="
    overflow-hidden

    rounded-[36px]

    border
    border-cyan-500/15

    bg-gradient-to-br
    from-[#081A33]
    via-[#091B37]
    to-[#07142B]

    shadow-[0_20px_60px_rgba(0,0,0,.35)]
"
              >
                <CardContent className="p-0">
                  {/* HEADER */}

                  <div
                    className="
        border-b
        border-white/5

        bg-gradient-to-r
        from-cyan-500/10
        via-sky-500/5
        to-transparent

        p-7
      "
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="
              h-14
              w-14

              rounded-3xl

              border
              border-cyan-500/20

              bg-cyan-500/10

              flex
              items-center
              justify-center
            "
                        >
                          <CalendarDays className="h-7 w-7 text-cyan-400" />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">
                            STEP 3
                          </p>

                          <h2 className="mt-1 text-3xl font-black text-white">
                            Schedule Your Visit
                          </h2>

                          <p className="mt-1 text-slate-400">
                            Choose a convenient date and available time slot.
                          </p>
                        </div>
                      </div>

                      <div
                        className="
            rounded-full

            border
            border-emerald-500/20

            bg-emerald-500/10

            px-4
            py-2

            text-sm
            font-semibold

            text-emerald-400
          "
                      >
                        Available Today
                      </div>
                    </div>
                  </div>

                  {/* BODY */}

                  <div className="p-7">
                    {/* DATE */}

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-300">
                        Select Booking Date
                      </label>

                      <div className="relative">
                        <CalendarDays
                          className="
              absolute
              left-5
              top-1/2
              -translate-y-1/2

              h-5
              w-5

              text-cyan-400
            "
                        />

                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="
              h-16
              w-full

              rounded-2xl

              border
              border-cyan-500/15

              bg-[#0B1D38]

              pl-14
              pr-5

              text-white

              outline-none

              transition-all

              focus:border-cyan-400
              focus:ring-4
              focus:ring-cyan-500/10
            "
                        />
                      </div>
                    </div>

                    {/* TIME */}

                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-slate-300">
                          Available Time Slots
                        </label>

                        <span className="text-xs text-cyan-400">
                          Choose your preferred time
                        </span>
                      </div>

                      <div
                        className="
            grid
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4

            gap-4
          "
                      >
                        {[
                          "08:00",
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "13:00",
                          "14:00",
                          "15:00",
                        ].map((slot) => {
                          const active = time === slot;

                          return (
                            <button
                              key={slot}
                              onClick={() => setTime(slot)}
                              className={`
                  group

                  relative

                  h-16

                  rounded-2xl

                  border

                  transition-all
                  duration-300

                  hover:-translate-y-1

                  ${
                    active
                      ? `
                        border-cyan-400

                        bg-gradient-to-r
                        from-cyan-500
                        to-sky-500

                        text-white

                        shadow-[0_0_30px_rgba(34,211,238,.25)]
                      `
                      : `
                        border-cyan-500/15

                        bg-[#0B1D38]

                        hover:border-cyan-500/40
                        hover:bg-[#10264A]

                        text-slate-300
                      `
                  }
                `}
                            >
                              {active && (
                                <CheckCircle2
                                  className="
                      absolute

                      right-2
                      top-2

                      h-4
                      w-4
                    "
                                />
                              )}

                              <div className="flex flex-col items-center">
                                <Clock3
                                  className={`
                      mb-1

                      h-5
                      w-5

                      ${active ? "text-white" : "text-cyan-400"}
                    `}
                                />

                                <span className="font-bold">{slot}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* INFO */}

                    <div
                      className="
          mt-8

          rounded-3xl

          border
          border-cyan-500/10

          bg-cyan-500/[0.04]

          p-5
        "
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="
              h-11
              w-11

              rounded-2xl

              bg-cyan-500/10

              flex
              items-center
              justify-center
            "
                        >
                          <ShieldCheck className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div>
                          <h4 className="font-bold text-white">
                            Booking Information
                          </h4>

                          <p className="mt-2 text-sm leading-relaxed text-slate-400">
                            Your booking will be confirmed instantly after
                            submission. If your selected time becomes
                            unavailable, we'll notify you immediately and
                            suggest the next available slot.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ================= BOOKING SUMMARY ================= */}

            <div className="relative min-w-0">
              <Card
                className="
      sticky
      top-6

      overflow-hidden

      rounded-[36px]

      border
      border-cyan-500/15

      bg-gradient-to-br
      from-[#081A33]
      via-[#091B37]
      to-[#07142B]

      shadow-[0_20px_60px_rgba(0,0,0,.35)]
    "
              >
                <CardContent className="p-0">
                  {/* =========================================================
      HEADER
  ========================================================= */}

                  <div className="relative overflow-hidden border-b border-white/10 p-5 sm:p-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                          Step 4 of 4
                        </span>

                        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white">
                          Booking Summary
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                          Review your booking details before confirming.
                        </p>
                      </div>

                      <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
                        Secure Checkout
                      </div>
                    </div>
                  </div>

                  {/* =========================================================
      CONTENT
  ========================================================= */}

                  <div className="space-y-4 p-4 sm:p-6">
                    {/* ================= VEHICLE ================= */}

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                          <Car className="h-6 w-6 text-cyan-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Vehicle
                          </p>

                          <h3 className="mt-1 truncate text-lg font-bold text-white">
                            {selectedVehicle?.plate_number ||
                              "No vehicle selected"}
                          </h3>

                          <p className="text-sm text-slate-400">
                            {selectedVehicle?.type || "--"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ================= PACKAGE ================= */}

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                          <Sparkles className="h-6 w-6 text-cyan-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Wash Package
                          </p>

                          <h3 className="mt-1 font-bold text-white">
                            {selectedService?.name || "Select a package"}
                          </h3>

                          <p className="text-sm text-slate-400">
                            {selectedService?.duration_minutes
                              ? `${selectedService.duration_minutes} Minutes`
                              : "--"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ================= APPOINTMENT ================= */}

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                          <CalendarDays className="h-6 w-6 text-cyan-400" />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Appointment
                          </p>

                          <h3 className="mt-1 font-semibold text-white">
                            {date || "Choose Date"}
                          </h3>

                          <p className="text-sm text-slate-400">
                            {time || "Choose Time"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ================= PRICE ================= */}

                    <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Total Amount
                          </p>

                          <h2 className="mt-2 text-4xl sm:text-5xl font-black text-cyan-400">
                            KES {selectedPrice.toLocaleString()}
                          </h2>
                        </div>

                        <div className="rounded-2xl bg-cyan-500/10 p-3 border border-cyan-500/20">
                          <Receipt className="h-7 w-7 text-cyan-400" />
                        </div>
                      </div>
                    </div>

                    {/* ================= ESTIMATED TIME ================= */}

                    {selectedService && time && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-center gap-3">
                          <Clock3 className="h-5 w-5 text-emerald-400" />

                          <div>
                            <p className="font-semibold text-white">
                              Estimated Duration
                            </p>

                            <p className="text-sm text-slate-400">
                              Approximately {selectedService.duration_minutes}{" "}
                              minutes
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================= NOTICE ================= */}

                    <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-1 h-5 w-5 text-cyan-400" />

                        <div>
                          <h4 className="font-semibold text-white">
                            Instant Confirmation
                          </h4>

                          <p className="mt-1 text-sm leading-relaxed text-slate-400">
                            Your booking is reserved immediately after
                            confirmation. You can manage or reschedule your
                            booking anytime from your dashboard.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ================= BUTTON ================= */}

                    <Button
                      onClick={createBooking}
                      disabled={
                        saving ||
                        !selectedVehicle ||
                        !selectedService ||
                        !date ||
                        !time
                      }
                      className="
        h-14
        w-full
        rounded-2xl
        bg-gradient-to-r
        from-cyan-500
        via-sky-500
        to-blue-600
        text-base
        font-semibold
        transition-all
        duration-300
        hover:shadow-[0_15px_35px_rgba(34,211,238,.35)]
        hover:scale-[1.01]
        disabled:opacity-50
        disabled:hover:scale-100
      "
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />

                      {saving ? "Creating Booking..." : "Confirm Booking"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
