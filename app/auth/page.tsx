"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

import {
  ShieldCheck,
  Crown,
  Car,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

/* =========================================
   PAGE
========================================= */

function AuthPageContent() {
  const [redirecting, setRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");

  const [carwashName, setCarwashName] = useState("");

  const [loading, setLoading] = useState(false);

  const [isLogin, setIsLogin] = useState(true);

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const redirectingRef = useRef(false);

  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  /* =========================================
     PREVENT HYDRATION
  ========================================= */

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode === "signup") {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [mode]);

  /* =========================================
     REDIRECT BASED ON ROLE
  ========================================= */

  const redirectUser = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      setErrorMessage("No profile found.");
      return;
    }

    switch (profile.role.toLowerCase()) {
      case "customer":
        router.replace("/customer/dashboard");
        break;

      case "washer":
        router.replace("/queue");
        break;

      case "cashier":
        router.replace("/pos");
        break;

      default:
        router.replace("/dashboard");
    }
  };

  /* =========================================
   SESSION CHECK
========================================= */
  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      await redirectUser(session.user.id);
    };

    run();
  }, []);

  /* =========================================
     PASSWORD STRENGTH
  ========================================= */

  const passwordStrength = useMemo(() => {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 6) strength += 1;

    if (password.length >= 10) strength += 1;

    if (/[A-Z]/.test(password)) strength += 1;

    if (/[0-9]/.test(password)) strength += 1;

    return strength;
  }, [password]);

  /* =========================================
     SIGNUP
  ========================================= */

  const handleSignup = async () => {
    try {
      setLoading(true);

      // STEP 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const user = data.user;

      if (!user) {
        setErrorMessage("User creation failed.");
        return;
      }

      // STEP 2: call database function
      const { data: result, error: fnError } = await supabase.rpc(
        "create_new_manager",
        {
          p_user_id: user.id,
          p_email: email,
          p_full_name: fullName,
          p_carwash_name: carwashName,
          p_location: location,
          p_phone: phone,
        },
      );

      if (fnError) {
        setErrorMessage(fnError.message);
        setLoading(false);
        return;
      }

      // STEP 4: Success
      setSuccessMessage("Account created successfully.");

      setIsLogin(true);

      setFullName("");
      setEmail("");
      setPassword("");
      setCarwashName("");
    } catch (err) {
      console.error(err);

      setErrorMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     LOGIN
  ========================================= */

  const handleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please fill all fields.");

      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);

        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("User not found.");

        return;
      }

      await redirectUser(user.id);
    } catch (err) {
      console.error(err);

      setErrorMessage("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const goToUniversalSignup = () => {
    router.push("/signup");
  };

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-6 text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-[450px] w-[450px] rounded-full bg-cyan-500/20 blur-[160px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-fuchsia-500/20 blur-[160px]" />
        <div className="absolute top-1/3 left-1/2 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      {/* MAIN CARD */}
      <div className="relative z-10 grid h-[92vh] w-full max-w-7xl grid-cols-1 overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.03] shadow-[0_25px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl xl:grid-cols-2">
        {/* LEFT SIDE */}

        <div className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10 p-12 xl:flex">
          <div>
            {/* LOGO */}

            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-cyan-400/20 bg-cyan-500/10">
                <Car className="h-11 w-11 text-cyan-400" />
              </div>

              <div>
                <h1 className="text-3xl font-black md:text-4xl xl:text-5xl">
                  Carwash System
                </h1>

                <p className="mt-2 text-lg text-gray-400">
                  Smart Carwash Management Platform
                </p>
              </div>
            </div>

            {/* FEATURES */}

            <div className="mt-16 space-y-10">
              <Feature
                icon={LayoutDashboard}
                title="Smart Dashboard"
                text="Track revenue, vehicles, queues and operational analytics in real time."
              />

              <Feature
                icon={ShieldCheck}
                title="Advanced Security"
                text="Professional role-based authentication with secure staff permissions."
              />

              <Feature
                icon={ClipboardList}
                title="Workflow Tracking"
                text="Manage wash queues, vehicle status and customer operations seamlessly."
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex h-full flex-col overflow-y-auto px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex flex-col overflow-y-auto p-5 sm:p-8 lg:p-10 xl:p-12">
            {/* MOBILE BRAND */}

            <div className="mb-8 flex items-center gap-4 xl:hidden">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 shadow-[0_0_30px_rgba(34,211,238,.15)]">
                <div className="absolute inset-0 rounded-3xl bg-cyan-500/10 blur-xl" />

                <Car className="relative h-7 w-7 text-cyan-400" />
              </div>

              <div>
                <h1 className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-2xl font-black text-transparent">
                  WashFlow Pro
                </h1>

                <p className="mt-0.5 text-xs font-medium tracking-[0.15em] text-slate-400 uppercase">
                  Smart Wash System
                </p>
              </div>
            </div>

            {/* HEADER */}

            <div className="mb-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.15em] text-cyan-300 uppercase backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                Enterprise Platform
              </div>

              <h2 className="mt-4 text-3xl leading-[1.05] font-black tracking-tight sm:text-4xl">
                {isLogin ? (
                  <>
                    Welcome Back
                    <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                      WashFlow Pro
                    </span>
                  </>
                ) : (
                  <>
                    Create Your
                    <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                      Carwash Account
                    </span>
                  </>
                )}
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                {isLogin
                  ? "Manage memberships, staff, queues, and revenue from one intelligent dashboard."
                  : "Launch your carwash with POS, subscriptions, loyalty rewards, and real-time analytics."}
              </p>
            </div>

            {/* ALERTS */}

            <div className="space-y-4">
              {errorMessage && (
                <div className="group animate-in slide-in-from-top-2 relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-4 shadow-[0_15px_40px_rgba(239,68,68,.08)] backdrop-blur-2xl duration-300">
                  {/* Glow */}
                  <div className="absolute top-1/2 -left-10 h-24 w-24 -translate-y-1/2 rounded-full bg-red-500/20 blur-3xl" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-bold tracking-[0.2em] text-red-300 uppercase">
                        Authentication Error
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-100">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="group animate-in slide-in-from-top-2 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 shadow-[0_15px_40px_rgba(34,197,94,.08)] backdrop-blur-2xl duration-300">
                  {/* Glow */}
                  <div className="absolute top-1/2 -left-10 h-24 w-24 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase">
                        Success
                      </p>

                      <p className="mt-1 text-sm leading-6 text-emerald-100">
                        {successMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mx-auto w-full max-w-xl">
              <div className="relative space-y-5 overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.03] to-transparent p-5 shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:p-6">
                <div className="absolute -top-20 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[90px]" />

                {/* FULL NAME */}
                {!isLogin && (
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                      Full Name
                    </label>

                    <div className="relative">
                      <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pr-4 pl-12 text-white transition-all outline-none placeholder:text-slate-500 hover:border-cyan-500/20 focus:border-cyan-400 focus:shadow-[0_0_25px_rgba(34,211,238,.15)]"
                      />
                    </div>
                  </div>
                )}

                {/* EMAIL */}
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pr-4 pl-12 text-white transition-all outline-none placeholder:text-slate-500 hover:border-cyan-500/20 focus:border-cyan-400 focus:shadow-[0_0_25px_rgba(34,211,238,.15)]"
                    />
                  </div>
                </div>

                {/* SIGNUP FIELDS */}
                {!isLogin && (
                  <>
                    <div>
                      <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                        Location
                      </label>

                      <input
                        type="text"
                        placeholder="Enter branch location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white transition-all outline-none placeholder:text-slate-500 hover:border-cyan-500/20 focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white transition-all outline-none placeholder:text-slate-500 hover:border-cyan-500/20 focus:border-cyan-400"
                      />
                    </div>

                    <div className="group">
                      <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                        Carwash Name
                      </label>

                      <div className="relative">
                        <Car className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

                        <input
                          type="text"
                          placeholder="Enter carwash name"
                          value={carwashName}
                          onChange={(e) => setCarwashName(e.target.value)}
                          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pr-4 pl-12 text-white transition-all outline-none placeholder:text-slate-500 hover:border-cyan-500/20 focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* PASSWORD */}
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        isLogin ? "current-password" : "new-password"
                      }
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pr-14 pl-12 text-white transition-all outline-none placeholder:text-slate-500 hover:border-cyan-500/20 focus:border-cyan-400 focus:shadow-[0_0_25px_rgba(34,211,238,.15)]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-500 transition hover:text-cyan-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {!isLogin && password && (
                    <div className="mt-3 rounded-2xl border border-white/5 bg-black/20 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Password Strength
                        </span>

                        <span className="font-semibold text-cyan-400">
                          {
                            ["Weak", "Fair", "Good", "Strong", "Excellent"][
                              passwordStrength
                            ]
                          }
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`h-2 flex-1 rounded-full transition-all ${
                              passwordStrength >= bar
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* REMEMBER */}
                {isLogin && (
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <label className="flex items-center gap-3 text-sm text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="h-4 w-4 accent-cyan-500"
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  onClick={isLogin ? handleLogin : handleSignup}
                  disabled={loading}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 font-bold text-white shadow-[0_15px_40px_rgba(34,211,238,.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(34,211,238,.35)] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? "Login to Dashboard" : "Create Account"}

                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* SWITCH */}
                <div className="pt-2 text-center">
                  {isLogin ? (
                    <button
                      onClick={() => router.push("/signup")}
                      className="text-sm text-slate-400 transition hover:text-cyan-400"
                    >
                      Don't have an account?{" "}
                      <span className="font-semibold text-cyan-400">
                        Create one
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsLogin(true);
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      className="text-sm text-slate-400 transition hover:text-cyan-400"
                    >
                      Already have an account?{" "}
                      <span className="font-semibold text-cyan-400">Login</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================
   FEATURE
========================================= */

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-5">
      <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/10 bg-cyan-500/10 md:h-14">
        <Icon className="h-6 w-6 text-cyan-400" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-white md:text-xl xl:text-2xl">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-gray-400 md:text-base xl:text-lg">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#020617]">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <Icon className="h-6 w-6 text-cyan-400" />

      <h3 className="mt-4 text-2xl font-black text-white">{value}</h3>

      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}
