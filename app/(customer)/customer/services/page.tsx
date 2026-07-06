"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";

type ServicePrice = {
  vehicle_type_id: string;
  vehicle_name: string;
  price: number;
};

type Service = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  pricing: ServicePrice[];
};

type ServiceCard = {
  id: string;
  serviceName: string;
  description?: string | null;
  duration: number | null;

  vehicleTypeId: string;
  vehicleTypeName: string;

  price: number;
};

export default function CustomerServicesPage() {
  const router = useRouter();

  const {
    activeBranch,
    isReady,
  } = useActiveBranch();

  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<ServiceCard[]>([]);

  const loadServices = useCallback(async () => {
    try {
      if (!activeBranch?.id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("services")
        .select(`
    id,
    name,
    description,
    duration_minutes,
    service_prices (
      price,
      vehicle_type_id
    )
  `)
        .eq("branch_id", activeBranch.id);

      const { data: vehicleTypes } = await supabase
        .from("vehicle_types")
        .select("id, name");

      const vehicleMap = Object.fromEntries(
        (vehicleTypes ?? []).map((v) => [
          v.id,
          v.name,
        ])
      );
      if (error) {
        console.error(
          "[CustomerServices] Failed to load services",
          error
        );
        return;
      }

      const formatted: ServiceCard[] = [];

      (data ?? []).forEach((service: any) => {
        service.service_prices?.forEach((priceRow: any) => {
          formatted.push({
            id: `${service.id}-${priceRow.vehicle_type_id}`,

            serviceName: service.name,
            description: service.description,
            duration: service.duration_minutes,

            vehicleTypeId: priceRow.vehicle_type_id,

            vehicleTypeName:
              vehicleMap[priceRow.vehicle_type_id] ??
              "Unknown Vehicle",

            price: priceRow.price,
          });
        });
      });

      setServices(formatted);
    } catch (error) {
      console.error(
        "[CustomerServices] Unexpected error",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    if (!isReady) return;

    if (!activeBranch?.id) {
      router.replace("/customer/select-branch");
      return;
    }

    loadServices();
  }, [
    isReady,
    activeBranch,
    loadServices,
    router,
  ]);

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-slate-400">
            Loading services...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="mb-8">
        <h1 className="text-sm sm:text-4xl font-bold">
          Services
        </h1>

        <p className="text-slate-400 mt-2">
          Services available at{" "}
          <span className="text-cyan-400">
            {activeBranch?.name}
          </span>
        </p>
      </div>

      {services.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <Card className="border border-white/10 bg-white/[0.03]">
            <CardContent className="p-10 text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-4 text-slate-500" />

              <h3 className="text-lg font-semibold">
                No Services Found
              </h3>

              <p className="text-slate-400 mt-2">
                This branch has not published any services yet.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

          {services.map((service) => (
            <Card
              key={service.id}
              className="
                rounded-[32px]
                border
                border-[#1A2D4D]
                bg-[#07142B]
                overflow-hidden
                shadow-[0_0_0_1px_rgba(255,255,255,0.02)]
                hover:border-cyan-500/40
                transition-all"
            >
              <CardContent className="p-2 sm:p-4">

                {/* HEADER */}
                <div className="flex items-start justify-between">

                  <div className="
        w-8 h-8 sm:w-14 sm:h-14 rounded-2xl
        bg-cyan-500/10
        border border-cyan-500/20
        flex items-center justify-center
      ">
                    <Sparkles className="w-4 h-4 sm:w-7 sm:h-7 text-cyan-400" />
                  </div>

                  <div className="
        px-3 py-1 text-xs
        rounded-full
        bg-yellow-500/10
        text-yellow-300
        font-bold
        uppercase
      ">
                    {service.vehicleTypeName}
                  </div>

                </div>

                {/* SERVICE */}
                <div className="mt-8">
                  <h3 className="text-xs sm:text-2xl font-black text-white">
                    {service.serviceName}
                  </h3>

                  <p className="hidden sm:block text-slate-400 mt-2 text-sm">
                    {service.description}
                  </p>
                </div>

                {/* PRICE + DURATION */}
                <div className="mt-3 sm:mt-8 flex items-end justify-between gap-2">

                  <div>
                    <p className="
          text-slate-500
          uppercase
          tracking-[4px]
          text-sm
          mb-2
        ">
                      Price
                    </p>

                    <h2 className="
          text-cyan-400
          font-black
          leading-none
          text-sm sm:text-4xl
        ">
                      KSh
                      <br />
                      {service.price.toLocaleString()}
                    </h2>
                  </div>

                  <div className="
        rounded-[24px]
        bg-white/5
        border border-white/10
        px-4 py-3
      ">
                    <p className="text-xs uppercase text-slate-400">
                      Duration
                    </p>

                    <p className="font-bold text-lg text-white mt-1">
                      {service.duration} mins
                    </p>
                  </div>

                </div>

              </CardContent>
            </Card>
          ))}

        </div>

      )}

    </div>

  );

}