"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import {
  Car,
  Loader2,
  Mail,
  Lock,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CustomerAuthPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [isLogin, setIsLogin] =
    useState(true);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [carwashes, setCarwashes] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCarwash, setSelectedCarwash] = useState("");
  /* =========================
     loadcarwashes
  ========================= */

  useEffect(() => {
    const loadCarwashes = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select(`
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
        ...new Set(
          (data || [])
            .map((b) => b.location)
            .filter(Boolean)
        ),
      ];

      setRegions(uniqueRegions);
    };

    loadCarwashes();
  }, []);

  const filteredCarwashes = selectedRegion
    ? carwashes.filter(
      (b) => b.location === selectedRegion
    )
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

      const { data: profile } =
        await supabase
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

      if (
        !fullName ||
        !email ||
        !password
      ) {
        setError(
          "Please fill all fields"
        );

        return;
      }

      if (
        !fullName ||
        !email ||
        !password ||
        !selectedCarwash
      ) {
        setError(
          "Please fill all fields and select a carwash"
        );
        return;
      }

      const {
        data: signupData,
        error: signupError,
      } = await supabase.auth.signUp({
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

      const selectedBranchData =
        carwashes.find(
          (branch) =>
            branch.id === selectedCarwash
        );

      if (!selectedBranchData) {
        setError("Please select a carwash");
        return;
      }

      const user =
        signupData.user;

      if (!user) {
        setError(
          "Failed to create account"
        );

        return;
      }

      /* =========================
         CREATE PROFILE
      ========================= */

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: "customer",

            branch_id:
              selectedBranchData.id,

            carwash_id:
              selectedBranchData.carwash_id,
          },
        ]);

      if (profileError) {
        console.error(
          profileError
        );

        setError(
          "Failed to create customer profile"
        );

        return;
      }

      router.push(
        "/customer/dashboard"
      );
    } catch (error: any) {
      console.error(error);

      setError(
        error.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOGIN
  ========================= */

  async function handleLogin() {
    try {
      setLoading(true);

      setError("");

      const {
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      if (loginError) {
        setError(loginError.message);

        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "User session not found"
        );

        return;
      }

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

      if (!profile) {
        setError(
          "Profile not found"
        );

        return;
      }

      if (
        profile.role === "customer"
      ) {
        router.push(
          "/customer/dashboard"
        );
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error(error);

      setError(
        error.message ||
        "Login failed"
      );
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

          <p className="text-gray-500">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <Card className="w-full max-w-md rounded-[32px] border-0 shadow-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white">

          <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur mb-5">

            <Car className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-black">
            Customer Portal
          </h1>

          <p className="text-white/80 mt-2">
            Login or create your customer
            account
          </p>
        </div>

        <CardContent className="p-8 space-y-5">

          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Full Name
                </label>

                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />

                  <Input
                    placeholder="John Doe"
                    className="pl-10 rounded-2xl h-12"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Region
                </label>

                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedCarwash("");
                  }}
                  className="w-full h-12 rounded-2xl border px-4"
                >
                  <option value="">
                    Select Region
                  </option>

                  {regions.map((region) => (
                    <option
                      key={region}
                      value={region}
                    >
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRegion && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Carwash
                  </label>

                  <select
                    value={selectedCarwash}
                    onChange={(e) =>
                      setSelectedCarwash(
                        e.target.value
                      )
                    }
                    className="w-full h-12 rounded-2xl border px-4"
                  >
                    <option value="">
                      Select Carwash
                    </option>

                    {filteredCarwashes.map(
                      (carwash) => (
                        <option
                          key={carwash.id}
                          value={carwash.id}
                        >
                          {carwash.carwashes?.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">

            <label className="text-sm font-medium">
              Email Address
            </label>

            <div className="relative">

              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />

              <Input
                type="email"
                placeholder="example@email.com"
                className="pl-10 rounded-2xl h-12"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
              />
            </div>
          </div>



          <div className="space-y-2">

            <label className="text-sm font-medium">
              Password
            </label>

            <div className="relative">

              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />

              <Input
                type="password"
                placeholder="••••••••"
                className="pl-10 rounded-2xl h-12"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            onClick={
              isLogin
                ? handleLogin
                : handleSignup
            }
            disabled={loading}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              "Login"
            ) : (
              "Create Account"
            )}
          </Button>

          <button
            onClick={() =>
              setIsLogin(!isLogin)
            }
            className="w-full text-sm text-blue-600 font-medium hover:underline"
          >
            {isLogin
              ? "Don't have an account? Create one"
              : "Already have an account? Login"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}