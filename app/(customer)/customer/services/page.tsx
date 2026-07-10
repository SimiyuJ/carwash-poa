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

  const { activeBranch, isReady } = useActiveBranch();

  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<ServiceCard[]>([]);

  const loadServices = useCallback(async () => {
    try {
      if (!activeBranch?.id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("services")
        .select(
          `
    id,
    name,
    description,
    duration_minutes,
    service_prices (
      price,
      vehicle_type_id
    )
  `,
        )
        .eq("branch_id", activeBranch.id);

      const { data: vehicleTypes } = await supabase
        .from("vehicle_types")
        .select("id, name");

      const vehicleMap = Object.fromEntries(
        (vehicleTypes ?? []).map((v) => [v.id, v.name]),
      );
      if (error) {
        console.error("[CustomerServices] Failed to load services", error);
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
              vehicleMap[priceRow.vehicle_type_id] ?? "Unknown Vehicle",

            price: priceRow.price,
          });
        });
      });

      setServices(formatted);
    } catch (error) {
      console.error("[CustomerServices] Unexpected error", error);
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
  }, [isReady, activeBranch, loadServices, router]);

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-slate-400">Loading services...</p>
        </div>
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
    text-white
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
      space-y-4
      lg:space-y-5
    "
      >
        {/* HERO */}

        <div className="relative overflow-hidden rounded-[30px] border border-cyan-500/10 bg-gradient-to-br from-[#07142B] via-[#0A1D3D] to-[#07142B]">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_40%)]" />

          {/* Top Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}

              <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                <div
                  className="
            h-12
            w-12
            sm:h-14
            sm:w-14
            lg:h-16
            lg:w-16
            shrink-0
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            flex
            items-center
            justify-center
          "
                >
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-cyan-400" />
                </div>

                <div className="min-w-0">
                  <p className="uppercase tracking-[2px] sm:tracking-[4px] text-[10px] sm:text-xs font-semibold text-cyan-400">
                    Premium Wash Services
                  </p>

                  <h1 className="mt-1 text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-slate-100">
                    Services
                  </h1>

                  <p className="mt-2 text-xs sm:text-sm lg:text-base text-slate-300">
                    Browse professional car wash services available at{" "}
                    <span className="font-semibold text-cyan-400">
                      {activeBranch?.name}
                    </span>
                  </p>
                </div>
              </div>

              {/* RIGHT STATS */}

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">
                    Services
                  </p>

                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-cyan-400">
                    {services.length}
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">
                    Branch
                  </p>

                  <h2 className="mt-1 text-sm sm:text-lg font-bold text-slate-200 truncate">
                    {activeBranch?.name}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="flex items-center justify-center py-6 sm:py-10">
            <Card
              className="
      relative
      w-full
      max-w-2xl
      overflow-hidden
      rounded-[30px]
      border
      border-cyan-500/10
      bg-gradient-to-br
      from-[#07142B]
      via-[#0A1D3D]
      to-[#07142B]
    "
            >
              {/* Background Glow */}

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_45%)]" />

              {/* Top Highlight */}

              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

              <CardContent className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 sm:py-16">
                {/* Icon */}

                <div
                  className="
          mb-6
          flex
          h-16
          w-16
          sm:h-20
          sm:w-20
          items-center
          justify-center
          rounded-3xl
          border
          border-cyan-500/20
          bg-cyan-500/10
          shadow-lg
          shadow-cyan-500/10
        "
                >
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-400" />
                </div>

                {/* Title */}

                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 text-center">
                  No Services Available
                </h2>

                {/* Description */}

                <p className="mt-3 max-w-lg text-center text-sm sm:text-base leading-relaxed text-slate-300">
                  There are currently no services published for
                  <span className="font-semibold text-cyan-400">
                    {" "}
                    {activeBranch?.name}
                  </span>
                  . Please check back later or choose another branch to explore
                  available wash packages.
                </p>

                {/* Footer */}

                <div className="mt-8 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-5 py-3">
                  <p className="text-xs sm:text-sm text-slate-400 text-center">
                    New services will appear here automatically once they're
                    available.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {services.map((service) => (
              <Card
                key={service.id}
                className="
        group
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-cyan-500/10
        bg-gradient-to-br
        from-[#07142B]
        via-[#0A1D3D]
        to-[#07142B]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-500/30
        hover:shadow-xl
        hover:shadow-cyan-500/10
      "
              >
                {/* Background Glow */}

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_45%)]" />

                {/* Top Highlight */}

                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                <CardContent className="relative p-3 sm:p-5">
                  {/* HEADER */}

                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="
              flex
              h-11
              w-11
              sm:h-14
              sm:w-14
              items-center
              justify-center
              rounded-2xl
              border
              border-cyan-500/20
              bg-cyan-500/10
            "
                    >
                      <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 text-cyan-400" />
                    </div>

                    <div
                      className="
              rounded-full
              border
              border-yellow-500/20
              bg-yellow-500/10
              px-2
              py-1
              text-[9px]
              sm:text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-yellow-300
              text-center
              max-w-[90px]
              truncate
            "
                    >
                      {service.vehicleTypeName}
                    </div>
                  </div>

                  {/* SERVICE */}

                  <div className="mt-4">
                    <h3 className="line-clamp-2 text-sm sm:text-xl font-black leading-tight text-slate-100">
                      {service.serviceName}
                    </h3>

                    <p className="mt-2 hidden sm:line-clamp-2 text-sm leading-relaxed text-slate-300 sm:block">
                      {service.description ||
                        "Professional vehicle care service."}
                    </p>
                  </div>

                  {/* INFO */}

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Price
                      </p>

                      <h2 className="mt-1 text-lg sm:text-3xl font-black text-cyan-400">
                        KSh {service.price.toLocaleString()}
                      </h2>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Duration
                        </p>

                        <p className="mt-1 text-sm sm:text-base font-semibold text-slate-200">
                          {service.duration} mins
                        </p>
                      </div>

                      <div
                        className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                border
                border-cyan-500/20
                bg-cyan-500/10
              "
                      >
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}

                  <div className="mt-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-3 py-2">
                    <p className="text-center text-[10px] sm:text-xs font-medium text-slate-300">
                      Available at{" "}
                      <span className="text-cyan-400">
                        {activeBranch?.name}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
