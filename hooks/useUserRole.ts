"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getRole = async () => {
      try {
        // ✅ SAFE: use session instead of getUser()
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;

        console.log("USER:", user);

        if (!user) {
          if (isMounted) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // 📦 Fetch profile safely
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        console.log("PROFILE:", data, error);

        if (!isMounted) return;

        if (error) {
          console.error("Profile fetch error:", error.message);
          setRole("client"); // fallback
        } else {
          setRole(data?.role || "client");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (isMounted) setRole("client");
      }

      if (isMounted) setLoading(false);
    };

    getRole();

    // ✅ Listen for login/logout changes (PRO upgrade)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        if (!user) {
          setRole(null);
          return;
        }

        // re-fetch role when auth changes
        getRole();
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { role, loading };
}