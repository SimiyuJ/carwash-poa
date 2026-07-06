"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
        alert("Please fill all required fields");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        alert("Invalid email format");
        return;
      }

      // 1. Get manager (stay logged in)
      const { data: { user } } = await supabase.auth.getUser();
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
        alert("Manager profile not found");
        return;
      }

      if (managerProfile.role !== "manager") {
        alert("Only managers can create staff");
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
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
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
      alert("Staff created successfully");

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
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[180px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[180px]" />
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">
            Add Staff Member
          </h1>

          <p className="mt-2 text-slate-400">
            Create secure staff accounts for your carwash operations.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="border-slate-700 bg-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
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

              <CardDescription>
                Enter employee details below.
              </CardDescription>
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
                  className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-900
                  px-4
                  text-white
                  outline-none
                  focus:border-cyan-500
                "
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@email.com"
                    className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-900
                    pl-11
                    pr-4
                    text-white
                    outline-none
                    focus:border-cyan-500
                  "
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254700000000"
                    className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-900
                    pl-11
                    pr-4
                    text-white
                    outline-none
                    focus:border-cyan-500
                  "
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
                    className={`rounded-2xl border p-4 text-left transition ${role === "washer"
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 bg-slate-900"
                      }`}
                  >
                    <h3 className="font-semibold text-white">
                      Washer
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Handles wash operations
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("cashier")}
                    className={`rounded-2xl border p-4 text-left transition ${role === "cashier"
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 bg-slate-900"
                      }`}
                  >
                    <h3 className="font-semibold text-white">
                      Cashier
                    </h3>

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
                  className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-900
                  px-4
                  text-white
                  outline-none
                  focus:border-cyan-500
                "
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">

                <Button
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleCreateStaff}
                  disabled={loading}
                  className="
                  flex-1
                  bg-cyan-500
                  hover:bg-cyan-600
                  text-white
                "
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Staff Account
                    </>
                  )}
                </Button>

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
              <h3 className="font-semibold text-cyan-400">
                Washer
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                View queue, start jobs, update wash status and complete services.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="font-semibold text-green-400">
                Cashier
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Create invoices, process payments and manage transactions.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <Users className="h-4 w-4" />
                Staff Policy
              </div>

              <p className="mt-2 text-sm text-slate-300">
                Managers can only create Washer and Cashier accounts.
                Manager accounts can only be created during carwash registration.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}