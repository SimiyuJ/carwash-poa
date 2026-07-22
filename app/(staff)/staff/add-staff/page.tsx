"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Users,
  UserPlus,
  Phone,
  Mail,
  ShieldCheck,
  Shield,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function AddStaffPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("washer");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleCreateStaff = async () => {
    try {
      setLoading(true);

      const cleanEmail = email.trim().toLowerCase();

      if (!fullName || !cleanEmail || !phone || !password) {
        toast.warning("Missing information", {
          description: "Please complete all required fields before continuing.",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        alert("Invalid email format");
        return;
      }

      // 1. Get manager (stay logged in)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Not authenticated");
        return;
      }

      const { data: managerProfile, error } = await supabase
        .from("profiles")
        .select("carwash_id, branch_id, role")
        .eq("id", user.id)
        .single();

      if (error || !managerProfile) {
        toast.error("Profile unavailable", {
          description:
            "Your manager profile could not be loaded. Please refresh the page and try again.",
        });
        return;
      }

      if (managerProfile.role !== "manager") {
        toast.error("Access denied", {
          description: "Only managers are allowed to create staff accounts.",
        });
        return;
      }

      // 2. Create auth user (DO NOT CARE ABOUT SESSION)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
            carwash_id: managerProfile.carwash_id,
            branch_id: managerProfile.branch_id,
          },
        },
      });

      if (signUpError) {
        alert(signUpError.message);
        return;
      }

      if (!data.user) {
        alert("User creation failed");
        return;
      }

      // 3. Insert profile manually (IMPORTANT)
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        email: cleanEmail,
        phone,
        role,
        carwash_id: managerProfile.carwash_id,
        branch_id: managerProfile.branch_id,
      });

      if (profileError) {
        alert(profileError.message);
        return;
      }

      // 4. ONLY SUCCESS MESSAGE (NO redirect, NO session restore)
      toast.success("Staff account created!", {
        description:
          "The new staff member can now sign in and start using the system.",
      });

      // optional: clear form
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("washer");
    } catch (err) {
      console.error(err);
      alert("Failed to create staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[180px]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[180px]" />
      </div>

      {/* Header */}
      {/* =========================================================
    HEADER
========================================================= */}

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-blue-600/10 shadow-lg shadow-cyan-500/10">
            <UserPlus className="h-8 w-8 text-cyan-400" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />

              <span className="text-[11px] font-semibold tracking-[0.25em] text-cyan-300 uppercase">
                Staff Management
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Add Staff Member
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Create secure employee accounts, assign roles, branches and
              permissions to manage your carwash operations efficiently.
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="h-12 rounded-2xl border-white/10 bg-slate-900/70 px-6 text-white transition-all hover:border-cyan-500/40 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Main Form */}
        <div className="xl:col-span-2">
          <Card className="border-slate-800 bg-slate-950/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <UserPlus className="h-5 w-5 text-cyan-400" />
                Staff Information
              </CardTitle>

              <CardDescription>Enter employee details below.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Full Name
                </label>

                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none focus:border-cyan-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@email.com"
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 pr-4 pl-11 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254700000000"
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 pr-4 pl-11 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="mb-3 block text-sm text-slate-400">
                  Staff Role
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("washer")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      role === "washer"
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <h3 className="font-semibold text-white">Washer</h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Handles wash operations
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("cashier")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      role === "cashier"
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <h3 className="font-semibold text-white">Cashier</h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Handles billing & payments
                    </p>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Temporary Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none focus:border-cyan-500"
                />
              </div>

              {/* Buttons */}
              {/* =========================================================
    ACTIONS
========================================================= */}

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="h-12 rounded-2xl border-slate-700 bg-slate-900/70 px-6 font-semibold text-slate-300 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>

                  <Button
                    onClick={handleCreateStaff}
                    disabled={loading}
                    className="h-12 min-w-[220px] rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-8 font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Staff Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <Card className="border-slate-800 bg-slate-950/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-cyan-400" />
              Permissions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="font-semibold text-cyan-400">Washer</h3>

              <p className="mt-2 text-sm text-slate-400">
                View queue, start jobs, update wash status and complete
                services.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="font-semibold text-green-400">Cashier</h3>

              <p className="mt-2 text-sm text-slate-400">
                Create invoices, process payments and manage transactions.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-cyan-300">
                <Users className="h-4 w-4" />
                Staff Policy
              </div>

              <p className="mt-2 text-sm text-slate-300">
                Managers can only create Washer and Cashier accounts. Manager
                accounts can only be created during carwash registration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
