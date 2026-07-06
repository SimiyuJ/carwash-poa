"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // optional auto-redirect timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGoBackToAuth = async () => {
    try {
      // IMPORTANT: clear session so auth page doesn't instantly redirect again
      await supabase.auth.signOut();

      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-black mb-4 text-red-500">
        Access Denied
      </h1>

      <p className="text-slate-400 max-w-md">
        You do not have permission to access this page.
        <br />
        You may need to log in again or contact your administrator.
      </p>

      {/* Countdown hint */}
      {countdown > 0 && (
        <p className="mt-4 text-slate-500 text-sm">
          Redirecting in {countdown}...
        </p>
      )}

      {/* BUTTON */}
      <button
        onClick={handleGoBackToAuth}
        className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 transition rounded-xl font-bold"
      >
        Back to Login
      </button>
    </div>
  );
}