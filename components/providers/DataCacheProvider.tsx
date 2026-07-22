"use client";

import { ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAppStore } from "@/stores/app-store";

export default function DataCacheProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = useAuth();

  const {
    initialized,
    setInitialized,
    setProfile,
    setBranches,
    setServices,
    setVehicleTypes,
    setStaff,
    clearStore,
  } = useAppStore();

  useEffect(() => {
    let mounted = true;

    // User logged out
    if (!profile) {
      clearStore();
      return;
    }

    const currentProfile = profile;

    if (!profile.carwash_id) {
      return;
    }

    // Already initialized
    if (initialized) return;

    async function initialize() {
      try {
        if (!initialized) {
          setProfile(profile);
        }
        const [branchesRes, servicesRes, vehicleTypesRes, staffRes] =
          await Promise.all([
            supabase
              .from("branches")
              .select("*")
              .eq("carwash_id", currentProfile.carwash_id)
              .order("name"),

            supabase
              .from("services")
              .select("*")
              .eq("carwash_id", currentProfile.carwash_id)
              .order("name"),

            supabase.from("vehicle_types").select("*").order("name"),

            supabase
              .from("staff")
              .select("*")
              .eq("carwash_id", currentProfile.carwash_id)
              .order("name"),
          ]);

        if (!mounted) return;

        setBranches(branchesRes.data ?? []);
        setServices(servicesRes.data ?? []);
        setVehicleTypes(vehicleTypesRes.data ?? []);
        setStaff(staffRes.data ?? []);

        setInitialized(true);

        console.log("✅ Global cache initialized");
      } catch (error) {
        console.error("Failed to initialize App Store:", error);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [
    profile?.id,
    profile?.carwash_id,
    initialized,
    clearStore,
    setBranches,
    setInitialized,
    setProfile,
    setServices,
    setStaff,
    setVehicleTypes,
  ]);

  return <>{children}</>;
}
