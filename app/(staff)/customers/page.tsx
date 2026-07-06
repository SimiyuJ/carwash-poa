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

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>

          <p className="text-gray-500 text-sm">
            Manage customers & registered vehicles
          </p>
        </div>

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

            setShowModal(true);
          }}
          className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl shadow-lg hover:shadow-cyan-500/40 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* ================= SEARCH ================= */}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowSuggestions(false);
        }}
        className="relative max-w-xl"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

            <Input
              className="pl-12 h-12 rounded-2xl border-gray-200 focus-visible:ring-cyan-500"
              placeholder="Search customer, phone or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
            />
          </div>

          <Button
            type="submit"
            className="rounded-2xl px-6 bg-[#0B1220] hover:bg-cyan-500 transition-all duration-300"
          >
            Search
          </Button>
        </div>

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
      </form>

      {/* ================= LIST ================= */}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((c) => {
          return (
            <Card
              key={c.id}
              className="
              group
              relative
              flex
              flex-col
              overflow-hidden
              cursor-pointer
              rounded-[2rem]
              border
              border-cyan-500/10
              bg-[#0B1220]
              text-white
              transition-all
              duration-500
              hover:-translate-y-2
              hover:border-cyan-400/40
              hover:shadow-[0_0_45px_rgba(0,255,255,0.35)]
              "
            >
              {/* ================= GLOW EDGE ================= */}

              <div className="absolute inset-0 rounded-[2rem] border border-white/5 pointer-events-none" />

              <div className="absolute -inset-[1px] rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-cyan-400/20 blur-xl" />

              {/* ================= TOP LIGHT ================= */}

              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

              <CardContent className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div
                      className="
                      h-14
                      w-14
                      rounded-2xl
                      bg-cyan-500/15
                      border
                      border-cyan-400/20
                      flex
                      items-center
                      justify-center
                      text-cyan-400
                      font-bold
                      text-xl
                      shadow-[0_0_20px_rgba(0,255,255,0.15)]
                    "
                    >
                      {c.name?.[0]}
                    </div>

                    <div>
                      <h2 className="font-bold text-lg tracking-wide">
                        {c.name}
                      </h2>

                      <div className="space-y-1 mt-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-cyan-400" />
                          {c.phone}
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-cyan-400" />
                          {c.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={`
                      flex
                      items-center
                      gap-1
                      rounded-xl
                      px-3
                      py-1
                      shadow-md
                      ${getTagColor(c.tag)}
                    `}
                  >
                    {getTagIcon(c.tag)}
                    {(c.tag || "regular").toUpperCase()}
                  </Badge>
                </div>

                {/* ================= VEHICLES ================= */}

                <div className="mt-6">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-[0.2em]">
                    Registered Vehicles
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {c.vehicles && c.vehicles.length > 0 ? (
                      c.vehicles.map((v, i) => (
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
                            "
                        >
                          <p className="text-sm font-semibold">
                            {v.plate_number}
                          </p>

                          <p className="text-xs text-gray-400">
                            {v.type} • {v.color}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No vehicles</p>
                    )}
                  </div>
                </div>

                {/* ================= ACTIONS ================= */}

                <div className="mt-auto pt-6 flex justify-end gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    title="Edit Customer"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCustomer(c);
                    }}
                    className="
                    border-cyan-500/20
                    text-cyan-400
                    hover:bg-cyan-500/10
                    "
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    title="Add Vehicle"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="
                    border-emerald-500/20
                    text-emerald-400
                    hover:bg-emerald-500/10
                    "
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    title="Delete Customer"
                    onClick={(e) => {
                      e.stopPropagation();

                      deleteCustomer(c.id, c.name);
                    }}
                    className="
                    border-red-500/20
                    text-red-400
                    hover:bg-red-500/10
                    hover:text-red-300
                    "
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
    </div>
  );
}
