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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-black text-white flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <p className="text-gray-500">Checking session...</p>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 shadow-2xl">
        {/* Header */}

        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 p-8 text-white">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
            <Car className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">
            Create Your Account
          </h1>

          <p className="mt-2 text-blue-100 leading-relaxed">
            Join your preferred carwash, earn loyalty points, manage your
            vehicles and enjoy exclusive offers.
          </p>
        </div>

        {/* Form */}

        <CardContent className="p-8 space-y-5">
          {/* Full Name */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Full Name
            </label>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <Input
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-2xl pl-11"
              />
            </div>
          </div>

          {/* Email */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl pl-11"
              />
            </div>
          </div>

          {/* Password */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <Input
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-2xl pl-11"
              />
            </div>
          </div>

          {/* Region */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Region
            </label>

            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedCarwash("");
              }}
              className="w-full h-12 rounded-2xl border border-gray-300 bg-white px-4 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your region</option>

              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Carwash */}

          {selectedRegion && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Preferred Carwash
              </label>

              <select
                value={selectedCarwash}
                onChange={(e) => setSelectedCarwash(e.target.value)}
                className="w-full h-12 rounded-2xl border border-gray-300 bg-white px-4 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your preferred carwash</option>

                {filteredCarwashes.map((carwash) => (
                  <option key={carwash.id} value={carwash.id}>
                    {carwash.carwashes?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Button */}

          <Button
            onClick={handleSignup}
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-base font-semibold shadow-lg hover:opacity-95"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Footer */}

          <div className="border-t pt-5 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?
              <a
                href="/customer-login"
                className="ml-1 font-semibold text-blue-600 hover:underline"
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
