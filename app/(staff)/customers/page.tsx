"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CustomerModal from "@/components/customers/CustomerModal";

import {
  Search,
  Plus,
  Mail,
  Phone,
  Car,
  Crown,
  Building2,
  Star,
  Pencil,
  Trash2,
} from "lucide-react";

/* ================= TYPES ================= */

type Tag = "regular" | "vip" | "corporate" | "new";

type Vehicle = {
  id?: string;
  plate_number: string;
  type: string;
  color: string;
};

type Wash = {
  id: string;
  customer_id: string;
  plate_number: string;
  service: string;
  price: number;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tag?: Tag;
  vehicles: Vehicle[];
  created_at: string;
};

/* ================= PAGE ================= */

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  /* ================= FORM ================= */

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [tag, setTag] = useState<Tag>("regular");

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan");

  const [color, setColor] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchCustomers();

    /* ================= REALTIME ================= */

    const customerChannel = supabase
      .channel("customers-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
        },
        () => {
          fetchCustomers();
        },
      )
      .subscribe();

    const vehicleChannel = supabase
      .channel("vehicles-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        () => {
          fetchCustomers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(customerChannel);
      supabase.removeChannel(vehicleChannel);
    };
  }, []);

  /* ================= FETCH TIMELINE ================= */

  const fetchCustomers = async () => {
    let query = supabase
      .from("customers")
      .select(
        `
        id,
        name,
        phone,
        email,
        tag,
        created_at,
        vehicles (
        id,
        plate_number,
        type,
        color
        )
        `,
      )
      .order("created_at", { ascending: false });

    if (!search.trim()) {
      query = query.limit(25);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error.message);
      return;
    }

    let filtered = data || [];

    if (search.trim()) {
      const q = search.toLowerCase();

      filtered = filtered.filter((customer) => {
        const matchesCustomer =
          customer.name?.toLowerCase().includes(q) ||
          customer.phone?.toLowerCase().includes(q) ||
          customer.email?.toLowerCase().includes(q);

        const matchesVehicle = customer.vehicles?.some((vehicle: Vehicle) =>
          vehicle.plate_number?.toLowerCase().includes(q),
        );

        return matchesCustomer || matchesVehicle;
      });
    }

    setCustomers(filtered);
  };

  /* ================= FILTERED CUSTOMERS ================= */
  const filteredCustomers = customers.filter((customer) => {
    const q = search.toLowerCase();

    return (
      customer.name?.toLowerCase().includes(q) ||
      customer.phone?.toLowerCase().includes(q) ||
      customer.email?.toLowerCase().includes(q) ||
      customer.vehicles?.some((v) => v.plate_number?.toLowerCase().includes(q))
    );
  });
  /* ================= AUTOSUGGEST ================= */

  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      return;
    }

    const q = search.toLowerCase();

    const results = customers
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.vehicles?.some((v) => v.plate_number?.toLowerCase().includes(q)),
      )
      .slice(0, 5);

    setSuggestions(results);
  }, [search, customers]);

  /* ================= TAG COLORS ================= */

  const getTagColor = (tag?: Tag) => {
    switch (tag) {
      case "vip":
        return "bg-yellow-500 text-black";

      case "corporate":
        return "bg-purple-500 text-white";

      case "new":
        return "bg-green-500 text-white";

      default:
        return "bg-cyan-500 text-white";
    }
  };

  /* ================= TAG ICONS ================= */

  const getTagIcon = (tag?: Tag) => {
    switch (tag) {
      case "vip":
        return <Crown className="h-3 w-3" />;

      case "corporate":
        return <Building2 className="h-3 w-3" />;

      case "new":
        return <Star className="h-3 w-3" />;

      default:
        return <Car className="h-3 w-3" />;
    }
  };

  /* ================= ADD CUSTOMER ================= */

  const addCustomer = async () => {
    if (!name || !phone) {
      setMessageType("error");
      setMessage("Name & phone required");
      return;
    }

    setLoading(true);

    setMessage("");
    setMessageType("");

    try {
      const cleanPlate = plate.trim().toUpperCase();

      /* ================= CHECK DUPLICATE ================= */

      if (cleanPlate) {
        const { data: existingVehicle } = await supabase
          .from("vehicles")
          .select("id")
          .eq("plate_number", cleanPlate)
          .maybeSingle();

        if (existingVehicle) {
          setMessageType("error");

          setMessage("Vehicle already exists in system");

          setLoading(false);
          return;
        }
      }

      /* ================= VEHICLE OBJECT ================= */

      const vehicleObject = cleanPlate
        ? {
            plate_number: cleanPlate,
            type: vehicleType || "UNKNOWN",
            color: color || "UNKNOWN",
          }
        : null;

      /* ================= SAVE CUSTOMER ================= */

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
            name,
            phone,
            email: email || null,
            tag,
            vehicles: vehicleObject ? [vehicleObject] : [],
          },
        ])
        .select()
        .single();

      if (customerError) {
        console.error(
          "CUSTOMER ERROR:",
          JSON.stringify(customerError, null, 2),
        );

        setMessageType("error");

        setMessage(customerError.message);

        setLoading(false);
        return;
      }

      /* ================= SAVE VEHICLE TABLE ================= */

      if (vehicleObject) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .insert([
            {
              customer_id: customerData.id,
              plate_number: vehicleObject.plate_number,
              type: vehicleObject.type,
              color: vehicleObject.color,
            },
          ])
          .select();

        if (vehicleError) {
          console.error("VEHICLE ERROR:", vehicleError);

          setMessageType("error");

          setMessage("Customer saved but vehicle sync failed");

          setLoading(false);
          return;
        }
      }

      /* ================= SUCCESS ================= */

      setMessageType("success");

      setMessage("Customer & vehicle saved successfully ✅");

      setName("");
      setPhone("");
      setEmail("");

      setTag("regular");

      setPlate("");
      setVehicleType("Sedan");
      setColor("");

      fetchCustomers();

      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    } catch (err: any) {
      console.error("UNEXPECTED ERROR:", err);

      setMessageType("error");

      setMessage(err.message || "Unexpected error");
    }

    setLoading(false);
  };

  /* ================= EDIT CUSTOMER ================= */
  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);

    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email || "");

    setTag(customer.tag || "regular");

    if (customer.vehicles?.length) {
      setPlate(customer.vehicles[0].plate_number);
      setVehicleType(customer.vehicles[0].type);
      setColor(customer.vehicles[0].color);
    }

    setShowModal(true);
  };

  /* ================= DELETE CUSTOMER ================= */
  const deleteVehicle = async (customerId: string, plateNumber: string) => {
    const confirmed = window.confirm(`Delete vehicle ${plateNumber}?`);

    if (!confirmed) return;

    try {
      const customer = customers.find((c) => c.id === customerId);

      if (!customer) return;

      const updatedVehicles =
        customer.vehicles?.filter((v) => v.plate_number !== plateNumber) || [];

      const { error } = await supabase
        .from("customers")
        .update({
          vehicles: updatedVehicles,
        })
        .eq("id", customerId);

      if (error) {
        console.error(error);
        return;
      }

      await supabase
        .from("vehicles")
        .delete()
        .eq("customer_id", customerId)
        .eq("plate_number", plateNumber);

      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };
  {
    /* ================= DELETE CUSTOMER ================= */
  }
  const deleteCustomer = async (customerId: string, customerName: string) => {
    const confirmed = window.confirm(`Delete ${customerName}?`);

    if (!confirmed) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (error) {
      console.error(error);
      return;
    }

    fetchCustomers();
  };
  {
    /* ================= UPDATE CUSTOMER ================= */
  }
  const updateCustomer = async () => {
    try {
      if (!editingCustomer) return;

      setLoading(true);

      setMessage("");
      setMessageType("");

      const updatePromise = supabase
        .from("customers")
        .update({
          name,
          phone,
          email: email || null,
          tag,
        })
        .eq("id", editingCustomer.id)
        .select();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Update request timed out after 15 seconds")),
          15000,
        ),
      );

      const result: any = await Promise.race([updatePromise, timeoutPromise]);

      const { error } = result;

      if (error) {
        setMessageType("error");
        setMessage(error.message);
        return;
      }

      setMessageType("success");
      setMessage("Customer updated successfully ✅");

      await fetchCustomers();

      setTimeout(() => {
        setShowModal(false);
        setEditingCustomer(null);
      }, 1000);
    } catch (err: any) {
      setMessageType("error");
      setMessage(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("showModal =", showModal);
  }, [showModal]);

  return (
    <div
      className="
    relative
    space-y-6
    rounded-3xl
    border
    border-white/10
    bg-white/[0.03]
    backdrop-blur-xl
    shadow-[0_20px_60px_rgba(0,0,0,0.35)]
    p-4
    sm:p-6
    lg:p-8
  "
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left */}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage customers and their registered vehicles.
          </p>
        </div>

        {/* Right */}
        <Button
          onClick={() => {
            setEditingCustomer(null);

            setName("");
            setPhone("");
            setEmail("");
            setTag("regular");

            setPlate("");
            setVehicleType("Sedan");
            setColor("");

            setMessage("");
            setMessageType("");

            console.log("Opening modal");

            setShowModal(true);
          }}
          className="
      w-full
      sm:w-auto
      h-11
      px-5
      rounded-2xl
      bg-cyan-500
      hover:bg-cyan-600
      text-white
      font-medium
      shadow-lg
      hover:shadow-cyan-500/30
      transition-all
      duration-300
      flex
      items-center
      justify-center
      gap-2
    "
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Add Customer</span>
        </Button>
      </div>

      {/* ================= SEARCH ================= */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowSuggestions(false);
        }}
        className="relative w-full max-w-2xl"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Input */}

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />

            <Input
              placeholder="Search customer, phone or vehicle..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              className="
        h-12
        sm:h-13

        w-full

        rounded-2xl

        border
        border-cyan-500/15

        bg-gradient-to-r
        from-white/5
        to-white/[0.02]

        pl-11
        pr-4

        text-sm
        sm:text-base

        text-white
        placeholder:text-slate-500

        backdrop-blur-xl

        transition-all
        duration-300

        focus-visible:ring-2
        focus-visible:ring-cyan-500/40
        focus-visible:border-cyan-400

        hover:border-cyan-500/25
      "
            />
          </div>

          {/* Search Button */}

          <Button
            type="submit"
            className="
            h-12
            shrink-0
            ounded-2xl
            px-4
            sm:px-6
            bg-gradient-to-r
            from-cyan-500
            via-sky-500
            to-blue-600
            font-semibold
            text-white
            shadow-lg
            shadow-cyan-500/20
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:shadow-cyan-500/40
            active:scale-95
            "
          >
            <Search className="h-4 w-4 sm:mr-2" />

            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      </form>

      {/* ================= CUSTOMER LIST ================= */}

      <div
        className="
    grid
    grid-cols-2
    md:grid-cols-2
    xl:grid-cols-3
    2xl:grid-cols-4
    gap-3
    md:gap-5
  "
      >
        {filteredCustomers.map((c) => (
          <Card
            key={c.id}
            className="
        group
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-cyan-500/10
        bg-gradient-to-br
        from-[#081A33]
        via-[#0A1D38]
        to-[#061425]
        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-cyan-400/40
        hover:shadow-[0_20px_60px_rgba(34,211,238,.18)]
      "
          >
            {/* Glow */}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.10),transparent_55%)] pointer-events-none" />

            <CardContent className="relative p-3 sm:p-6 flex flex-col h-full">
              {/* HEADER */}

              <div className="flex items-start gap-3">
                {/* Avatar */}

                <div
                  className="
              h-11
              w-11
              sm:h-14
              sm:w-14

              shrink-0

              rounded-2xl

              bg-gradient-to-br
              from-cyan-500
              to-sky-500

              flex
              items-center
              justify-center

              text-sm
              sm:text-xl

              font-black
              text-white

              shadow-[0_10px_30px_rgba(34,211,238,.30)]
            "
                >
                  {c.name?.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-white text-sm sm:text-xl truncate">
                      {c.name}
                    </h2>

                    <Badge
                      className={`
                  shrink-0
                  rounded-full
                  px-2
                  sm:px-3
                  py-1
                  text-[10px]
                  sm:text-[11px]
                  ${getTagColor(c.tag)}
                `}
                    >
                      {getTagIcon(c.tag)}
                      <span className="hidden sm:inline ml-1">
                        {(c.tag || "Regular").toUpperCase()}
                      </span>
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] sm:text-sm text-slate-400">
                      <Phone className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] sm:text-sm text-slate-400">
                      <Mail className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{c.email || "No email"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK STATS */}

              <div
                className="
            mt-5

            grid
            grid-cols-2

            gap-2
          "
              >
                <div
                  className="
              rounded-2xl
              border
              border-white/5
              bg-white/[0.04]
              p-3
              text-center
            "
                >
                  <p className="text-lg font-black text-cyan-400">
                    {c.vehicles?.length || 0}
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Vehicles
                  </p>
                </div>

                <div
                  className="
              rounded-2xl
              border
              border-white/5
              bg-white/[0.04]
              p-3
              text-center
            "
                >
                  <p className="text-lg font-black text-emerald-400">Active</p>

                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Status
                  </p>
                </div>
              </div>

              {/* VEHICLES */}

              <div className="mt-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Registered Vehicles
                </p>

                <div className="space-y-2">
                  {c.vehicles?.length ? (
                    c.vehicles.map((v, i) => (
                      <div
                        key={i}
                        className="
                    flex
                    items-center
                    justify-between

                    rounded-2xl

                    border
                    border-cyan-500/10

                    bg-cyan-500/[0.03]

                    px-3
                    py-3

                    transition-all

                    hover:bg-cyan-500/[0.06]
                    hover:border-cyan-500/30
                  "
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">
                            {v.plate_number}
                          </p>

                          <p className="text-xs text-slate-400 truncate">
                            {v.type} • {v.color}
                          </p>
                        </div>

                        <Car className="h-5 w-5 text-cyan-400 shrink-0" />
                      </div>
                    ))
                  ) : (
                    <div
                      className="
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-700
                  bg-white/[0.03]
                  py-6
                  text-center
                  text-xs
                  text-slate-500
                "
                    >
                      No registered vehicles
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-auto pt-5 grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditCustomer(c);
                  }}
                  className="
              h-11
              rounded-2xl
              border-cyan-500/20
              bg-cyan-500/5
              text-cyan-400
              hover:bg-cyan-500/15
              hover:border-cyan-400
            "
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={(e) => e.stopPropagation()}
                  className="
              h-11
              rounded-2xl
              border-emerald-500/20
              bg-emerald-500/5
              text-emerald-400
              hover:bg-emerald-500/15
            "
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomer(c.id, c.name);
                  }}
                  className="
              h-11
              rounded-2xl
              border-red-500/20
              bg-red-500/5
              text-red-400
              hover:bg-red-500/15
            "
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================= DRAWER ================= */}

      {activeCustomer && (
        <div
          onClick={() => setActiveCustomer(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[420px] max-w-full bg-[#0B1220] text-white h-full p-6 overflow-y-auto border-l border-cyan-500/20 shadow-[0_0_40px_rgba(0,255,255,0.15)]"
          >
            <h2 className="text-2xl font-bold">{activeCustomer.name}</h2>

            <p className="text-gray-400 mt-1">{activeCustomer.phone}</p>

            <p className="text-gray-400">{activeCustomer.email}</p>

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Vehicles</h3>

              <div className="space-y-3">
                {activeCustomer.vehicles?.map((v, i) => (
                  <div
                    key={i}
                    className="
    rounded-2xl
    border
    border-cyan-500/10
    bg-[#F8FAFC]/5
    px-3
    py-2
    backdrop-blur-sm
    transition-all
    duration-300
    hover:border-cyan-400/30
    hover:bg-cyan-500/10
    hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]
    flex
    justify-between
    items-start
    gap-3
  "
                  >
                    <div>
                      <p className="text-sm font-semibold">{v.plate_number}</p>

                      <p className="text-xs text-gray-400">
                        {v.type} • {v.color}
                      </p>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete Vehicle"
                      onClick={(e) => {
                        e.stopPropagation();

                        deleteVehicle(activeCustomer.id, v.plate_number);
                      }}
                      className="
                          h-8
                          w-8
                          text-red-400
                          hover:text-red-300
                          hover:bg-red-500/10
                          "
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUGGESTIONS ================= */}

      <CustomerModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editingCustomer={editingCustomer}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        email={email}
        setEmail={setEmail}
        tag={tag}
        setTag={setTag}
        plate={plate}
        setPlate={setPlate}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        color={color}
        setColor={setColor}
        loading={loading}
        message={message}
        messageType={messageType}
        onSubmit={editingCustomer ? updateCustomer : addCustomer}
      />
    </div>
  );
}
