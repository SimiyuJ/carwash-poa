"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";
import { Button } from "@/components/ui/button";

import { Car, Loader2, MapPin, CheckCircle2, ChevronDown } from "lucide-react";

type Branch = {
  id: string;
  name: string;
  location: string | null;
};

type Carwash = {
  id: string;
  name: string;
  branches: Branch[];
};

export default function AddCarwashPage() {
  const [loading, setLoading] = useState(true);
  const [carwashes, setCarwashes] = useState<Carwash[]>([]);

  const router = useRouter();

  const { setActiveBranch } = useActiveBranch();

  const [search, setSearch] = useState("");

  const [expandedCarwash, setExpandedCarwash] = useState<string | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<{
    id: string;
    name: string;
    carwashId: string;
  } | null>(null);
  useEffect(() => {
    loadCarwashes();
  }, []);

  async function loadCarwashes() {
    try {
      setLoading(true);

      const response = await supabase
        .from("carwashes")
        .select(
          `
          id,
          name,
          branches(
          id,
          name,
          location)
          `,
        )
        .order("name");

      console.log("Supabase Response:", response);

      if (response.error) {
        console.log("Error message:", response.error.message);
        console.log("Error details:", response.error.details);
        console.log("Error hint:", response.error.hint);
        console.log("Error code:", response.error.code);
        return;
      }

      console.log("Data:", response.data);

      setCarwashes(response.data || []);
    } catch (err) {
      console.error("Unexpected Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function connectCarwash(
    carwashId: string,
    branch: {
      id: string;
      name: string;
    },
  ) {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in.");
        return;
      }

      /*
       * Find the customer record
       * for THIS profile inside THIS branch.
       */
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (customerError) throw customerError;

      let customerId = customer?.id;

      if (customerId) {
        const { error: updateCustomerError } = await supabase
          .from("customers")
          .update({
            carwash_id: carwashId,
            branch_id: branch.id,
          })
          .eq("id", customerId);

        if (updateCustomerError) throw updateCustomerError;
      }

      if (!customerId) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name,email,phone")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const { data: newCustomer, error: insertCustomerError } = await supabase
          .from("customers")
          .insert({
            profile_id: user.id,
            branch_id: branch.id,
            carwash_id: carwashId,
            name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            loyalty_points: 0,
            loyalty_level: "Bronze",
          })
          .select("id")
          .single();

        if (insertCustomerError) throw insertCustomerError;

        customerId = newCustomer.id;

        customerId = newCustomer.id;
      }

      /*
       * Check link
       */
      const { data: existing, error: existingError } = await supabase
        .from("customer_carwashes")
        .select("id")
        .eq("customer_id", user.id)
        .eq("carwash_id", carwashId)
        .eq("branch_id", branch.id)
        .maybeSingle();

      if (existingError) throw existingError;

      /*
       * Create link
       */
      if (!existing) {
        const { data, error: insertError } = await supabase
          .from("customer_carwashes")
          .insert({
            customer_id: user.id,
            carwash_id: carwashId,
            branch_id: branch.id,
          })
          .select();

        console.log("Inserted customer_carwash:", data);

        if (insertError) throw insertError;
      }

      /*
       * Save active workspace
       */
      const activeWorkspace = {
        id: branch.id,
        name: branch.name,
        carwashId,
        customerId,
      };

      console.log("Saving Active Branch:", activeWorkspace);

      setActiveBranch(activeWorkspace);

      router.push("/customer/dashboard");
    } catch (error: any) {
      console.error(error);

      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
      min-h-screen
      bg-gradient-to-br
      from-[#07142B]
      via-[#081A33]
      to-[#07142B]
      text-white
      px-4
      py-6
      lg:px-8
    "
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HERO */}

        <div
          className="
          rounded-[34px]
          overflow-hidden
          border
          border-cyan-500/15
          bg-gradient-to-r
          from-[#07142B]
          via-[#0B1D3C]
          to-[#07142B]
        "
        >
          <div className="p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-cyan-300 text-sm font-semibold">
                  <Car className="h-4 w-4" />
                  Customer Portal
                </div>

                <h1 className="text-4xl lg:text-5xl font-black mt-5">
                  Connect Another Car Wash
                </h1>

                <p className="text-slate-400 mt-3 max-w-2xl">
                  Search nearby car washes, choose your preferred branch and
                  instantly switch between them whenever you want.
                </p>
              </div>

              <div
                className="
                w-24
                h-24
                rounded-3xl
                bg-cyan-500/10
                border
                border-cyan-500/20
                flex
                items-center
                justify-center
              "
              >
                <Car className="h-12 w-12 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div
          className="
          rounded-[30px]
          border
          border-[#1A2D4D]
          bg-[#07142B]
          p-6
        "
        >
          <input
            placeholder="Search car wash or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
            w-full
            h-14
            rounded-2xl
            border
            border-[#1A2D4D]
            bg-[#091A34]
            px-5
            text-white
            placeholder:text-slate-500
            focus:border-cyan-500
            outline-none
          "
          />
        </div>

        {/* CONTENT */}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          </div>
        ) : carwashes.length === 0 ? (
          <div
            className="
            rounded-[30px]
            border
            border-[#1A2D4D]
            bg-[#07142B]
            py-20
            text-center
          "
          >
            <Car className="mx-auto h-12 w-12 text-slate-500" />

            <h2 className="mt-5 text-2xl font-bold">No Car Washes Found</h2>

            <p className="text-slate-400 mt-2">
              There are currently no registered car washes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {carwashes
              .filter((c) =>
                c.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((carwash) => (
                <div
                  key={carwash.id}
                  className="
                  rounded-[30px]
                  border
                  border-[#1A2D4D]
                  bg-[#07142B]
                  overflow-hidden
                "
                >
                  {/* HEADER */}

                  <button
                    onClick={() =>
                      setExpandedCarwash(
                        expandedCarwash === carwash.id ? null : carwash.id,
                      )
                    }
                    className="
                    w-full
                    flex
                    items-center
                    justify-between
                    p-7
                    hover:bg-white/[0.02]
                    transition
                  "
                  >
                    <div>
                      <h2 className="text-2xl font-black">{carwash.name}</h2>

                      <p className="text-slate-400 mt-1">
                        {carwash.branches?.length || 0} Branches Available
                      </p>
                    </div>

                    <ChevronDown
                      className={`transition ${
                        expandedCarwash === carwash.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* BRANCHES */}

                  {expandedCarwash === carwash.id && (
                    <div className="border-t border-[#1A2D4D] p-6 space-y-4">
                      {carwash.branches?.map((branch) => {
                        const selected = selectedBranch?.id === branch.id;

                        return (
                          <button
                            key={branch.id}
                            onClick={() =>
                              setSelectedBranch({
                                id: branch.id,
                                name: branch.name,
                                carwashId: carwash.id,
                              })
                            }
                            className={`
                            w-full
                            rounded-3xl
                            border
                            p-5
                            text-left
                            transition-all

                            ${
                              selected
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-[#1A2D4D] bg-[#091A34]"
                            }
                          `}
                          >
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-bold text-lg">
                                  {branch.name}
                                </h3>

                                <div className="flex items-center gap-2 mt-2 text-slate-400">
                                  <MapPin className="h-4 w-4" />

                                  {branch.location || "Location unavailable"}
                                </div>
                              </div>

                              {selected && (
                                <CheckCircle2 className="text-cyan-400 h-6 w-6" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* FOOTER ACTION */}

        {selectedBranch && (
          <div
            className="
            sticky
            bottom-6
            rounded-[30px]
            border
            border-cyan-500/20
            bg-[#07142B]/95
            backdrop-blur-xl
            p-6
          "
          >
            <div className="flex flex-col lg:flex-row gap-5 items-center justify-between">
              <div>
                <p className="text-slate-400">Selected Branch</p>

                <h2 className="text-2xl font-black">{selectedBranch.name}</h2>
              </div>

              <Button
                onClick={() =>
                  connectCarwash(selectedBranch.carwashId, {
                    id: selectedBranch.id,
                    name: selectedBranch.name,
                  })
                }
                disabled={loading}
                className="
                h-14
                px-10
                rounded-2xl
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
                text-lg
                font-bold
              "
              >
                Connect Car Wash
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
