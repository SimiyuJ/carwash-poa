"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Loader2, Car, MapPin, CheckCircle2 } from "lucide-react";

import { supabase } from "@/lib/supabase";

import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";

type ActiveBranch = {
  id: string;
  name: string;
  location?: string | null;
  carwashId: string;
};

export default function SelectCarWashPage() {
  const router = useRouter();

  const { activeBranch, setActiveBranch, isReady } = useActiveBranch();
  console.log("Provider State:", {
    isReady,
    activeBranch,
  });

  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<ActiveBranch[]>([]);

  const loadCarwashes = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/customer/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("branch_id, carwash_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.branch_id) {
        setBranches([]);
        return;
      }

      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select(
          `
    id,
    name,
    location,
    carwash_id
  `,
        )
        .eq("id", profile.branch_id);

      if (branchesError) throw branchesError;

      const formatted =
        branchesData?.map((branch) => ({
          id: branch.id,
          name: branch.name,
          location: branch.location,
          carwashId: branch.carwash_id,
        })) ?? [];

      setBranches(formatted);
      /*
       * If customer only belongs to one car wash,
       * auto-select and continue.
       */
      if (formatted.length === 1) {
        const selected = formatted[0];

        setActiveBranch({
          id: selected.id,
          name: selected.name,
          carwashId: selected.carwashId,
        });

        return;
      }
    } catch (error) {
      console.error("[SelectCarWash] Unexpected error", error);
    } finally {
      setLoading(false);
    }
  }, [router, setActiveBranch]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    loadCarwashes();
  }, [isReady, loadCarwashes]);

  const handleSelectBranch = (branch: ActiveBranch) => {
    setActiveBranch({
      id: branch.id,
      name: branch.name,
      carwashId: branch.carwashId,
    });

    router.push("/customer/dashboard");
  };

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div
          className="
          flex
          flex-col
          items-center
          gap-5
          rounded-[32px]
          border
          border-cyan-500/10
          bg-gradient-to-b
          from-[#07142B]
          to-[#020817]
          p-10
        "
        >
          <div
            className="
            h-20
            w-20
            rounded-3xl
            bg-cyan-500/10
            border
            border-cyan-500/20
            flex
            items-center
            justify-center
          "
          >
            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Loading Car Washes</h3>

            <p className="text-slate-400 mt-1">
              Please wait while we prepare your workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="
    w-full
    max-w-xl
    rounded-[32px]
    overflow-hidden
    border
    border-cyan-500/10
    bg-[#07142B]
    shadow-[0_0_40px_rgba(6,182,212,0.08)]
  "
      >
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white">
          <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur mb-5">
            <Car className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-black">Select Car Wash</h1>

          <p className="text-white/80 mt-2">
            Choose the car wash you want to use.
          </p>
        </div>

        <div className="space-y-3 p-6">
          {branches.map((branch) => {
            const selected = activeBranch?.id === branch.id;

            return (
              <button
                key={branch.id}
                onClick={() => handleSelectBranch(branch)}
                className={`w-full rounded-3xl border p-5 text-left transition-all 
                                ${
                                  selected
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-[#1A2D4D]  bg-[#091A34]  hover:border-cyan-500/40"
                                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{branch.name}</h3>

                    {branch.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {branch.location}
                      </div>
                    )}
                  </div>

                  {selected && (
                    <div className="rounded-full bg-cyan-500 text-white p-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <div className="px-6 pb-6">
            <button
              onClick={() => router.push("/customer/add-carwash")}
              className="
      w-full
      rounded-2xl
      border
      border-dashed
      border-cyan-500/30
      bg-cyan-500/5
      py-4
      text-cyan-400
      font-semibold
      hover:bg-cyan-500/10
      transition
    "
            >
              + Add Another Car Wash
            </button>
          </div>

          {branches.length === 0 && (
            <div className="py-10 text-center">
              <Car className="w-8 h-8 mx-auto mb-3 text-gray-400" />

              <h3 className="font-medium">No Car Washes Found</h3>

              <p className="text-sm text-slate-400 mt-1">
                Your account is not linked to any car wash.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
