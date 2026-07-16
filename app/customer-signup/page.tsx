"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Car, Loader2, Mail, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CustomerAuthPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [checking, setChecking] = useState(true);

  const [fullName, setFullName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [carwashes, setCarwashes] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCarwash, setSelectedCarwash] = useState("");
  /* =========================
     loadcarwashes
  ========================= */

  useEffect(() => {
    const loadCarwashes = async () => {
      const { data, error } = await supabase.from("branches").select(`
    id,
    name,
    location,
    carwash_id,
    carwashes (
      id,
      name
    )
  `);

      if (error) {
        setError(error.message);

        return;
      }

      setCarwashes(data || []);

      const uniqueRegions = [
        ...new Set((data || []).map((b) => b.location).filter(Boolean)),
      ];

      setRegions(uniqueRegions);
    };

    loadCarwashes();
  }, []);

  const filteredCarwashes = selectedRegion
    ? carwashes.filter((b) => b.location === selectedRegion)
    : [];

  /* =========================
     CHECK EXISTING SESSION
  ========================= */

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChecking(false);

        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setChecking(false);

        return;
      }

      if (profile.role === "customer") {
        router.push("/customer/dashboard");

        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  }

  /* =========================
     SIGN UP
  ========================= */

  async function handleSignup() {
    try {
      setLoading(true);

      setError("");

      if (!fullName || !email || !password) {
        setError("Please fill all fields");

        return;
      }

      if (!fullName || !email || !password || !selectedCarwash) {
        setError("Please fill all fields and select a carwash");
        return;
      }

      const { data: signupData, error: signupError } =
        await supabase.auth.signUp({
          email,
          password,

          options: {
            data: {
              full_name: fullName,
            },
          },
        });

      if (signupError) {
        setError(signupError.message);

        return;
      }

      const selectedBranchData = carwashes.find(
        (branch) => branch.id === selectedCarwash,
      );

      if (!selectedBranchData) {
        setError("Please select a carwash");
        return;
      }

      const user = signupData.user;

      if (!user) {
        setError("Failed to create account");

        return;
      }

      /* =========================
         CREATE PROFILE
      ========================= */

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: "customer",

          branch_id: selectedBranchData.id,

          carwash_id: selectedBranchData.carwash_id,
        },
      ]);

      if (profileError) {
        console.error(profileError);

        setError("Failed to create customer profile");

        return;
      }

      router.push("/customer/dashboard");
    } catch (error: any) {
      console.error(error);

      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
   LOADING
========================= */

  if (checking) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#07142B] via-[#081A33] to-[#040B18]">
        {/* Background Glow */}

        <div className="absolute top-0 -left-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex w-full max-w-sm flex-col items-center rounded-[32px] border border-cyan-500/15 bg-gradient-to-br from-[#0A1529] via-[#091B34] to-[#07111F] p-10 shadow-[0_25px_80px_rgba(0,0,0,.45)] backdrop-blur-xl">
          {/* Spinner */}

          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />

            <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          </div>

          {/* Text */}

          <h2 className="mt-8 text-2xl font-black text-white">
            Preparing Your Dashboard
          </h2>

          <p className="mt-3 text-center text-sm leading-relaxed text-slate-400">
            Verifying your account, loading your carwash and getting everything
            ready...
          </p>

          {/* Progress Bar */}

          <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#07142B] via-[#081A33] to-[#040B18] px-4 py-10">
      {/* Background Glow */}

      <div className="absolute top-0 -left-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />

      <Card className="relative w-full max-w-xl overflow-hidden rounded-[34px] border border-cyan-500/15 bg-gradient-to-br from-[#0A1529] via-[#091B34] to-[#07111F] shadow-[0_25px_80px_rgba(0,0,0,.45)] backdrop-blur-xl">
        {/* Header */}

        <div className="relative overflow-hidden border-b border-white/10 p-8">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-cyan-500/20 bg-cyan-500/10 shadow-[0_0_35px_rgba(34,211,238,.15)]">
            <Car className="h-10 w-10 text-cyan-400" />
          </div>

          <h1 className="mt-6 text-3xl font-black text-white">
            Create Customer Account
          </h1>

          <p className="mt-3 leading-relaxed text-slate-400">
            Register your account to book washes, collect loyalty points, manage
            your vehicles and enjoy member-only offers.
          </p>
        </div>

        <CardContent className="space-y-6 p-8">
          {/* ================= NAME ================= */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">
              Full Name
            </label>

            <p className="text-xs text-slate-500">
              Enter the name that appears on your ID or driving licence.
            </p>

            <div className="relative">
              <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-cyan-400" />

              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Example: John Mwangi"
                className="h-13 rounded-2xl border-white/10 bg-white/[0.04] pl-12 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {/* ================= EMAIL ================= */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">
              Email Address
            </label>

            <p className="text-xs text-slate-500">
              We'll use this email to sign you in and send receipts.
            </p>

            <div className="relative">
              <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-cyan-400" />

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Example: john@gmail.com"
                className="h-13 rounded-2xl border-white/10 bg-white/[0.04] pl-12 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* ================= PASSWORD ================= */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">
              Password
            </label>

            <p className="text-xs text-slate-500">
              Use at least 8 characters with letters and numbers.
            </p>

            <div className="relative">
              <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-cyan-400" />

              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="h-13 rounded-2xl border-white/10 bg-white/[0.04] pl-12 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* ================= REGION ================= */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">
              Your Region
            </label>

            <p className="text-xs text-slate-500">
              Choose the county or town where you normally wash your vehicle.
            </p>

            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedCarwash("");
              }}
              className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none focus:border-cyan-500"
            >
              <option value="">Select your region</option>

              {regions.map((region) => (
                <option key={region} value={region} className="bg-[#081A33]">
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* ================= CARWASH ================= */}

          {selectedRegion && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Preferred Carwash
              </label>

              <p className="text-xs text-slate-500">
                Select the carwash you visit most often.
              </p>

              <select
                value={selectedCarwash}
                onChange={(e) => setSelectedCarwash(e.target.value)}
                className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none focus:border-cyan-500"
              >
                <option value="">Choose your preferred carwash</option>

                {filteredCarwashes.map((carwash) => (
                  <option
                    key={carwash.id}
                    value={carwash.id}
                    className="bg-[#081A33]"
                  >
                    {carwash.carwashes?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Button */}

          <Button
            onClick={handleSignup}
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-base font-bold shadow-[0_10px_35px_rgba(34,211,238,.35)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_15px_40px_rgba(34,211,238,.45)]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Create My Account"
            )}
          </Button>

          {/* Footer */}

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?
              <a
                href="/auth"
                className="ml-2 font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Sign In
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
