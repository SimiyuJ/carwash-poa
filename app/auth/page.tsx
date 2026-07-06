"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
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
  CreditCard,
  Sparkles,
  UserCog,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Activity,
  BarChart3,
  Users,
} from "lucide-react";

/* =========================================
   PAGE
========================================= */

export default function AuthPage() {
  const [redirecting, setRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

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

  /* =========================================
     REDIRECT BASED ON ROLE
  ========================================= */

  const redirectUser = async (userId: string) => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;

    try {
      let role = null;

      for (let i = 0; i < 10; i++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (data?.role) {
          role = data.role;
          break;
        }

        await new Promise((r) => setTimeout(r, 500));
      }

      if (!role) {
        console.error("Profile not ready or blocked by RLS");
        return;
      }

      role = role.toLowerCase();

      if (role === "washer") router.replace("/queue");
      else if (role === "cashier") router.replace("/pos");
      else router.replace("/dashboard");
    } catch (err) {
      console.error("Redirect error:", err);
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

      const userId = session.user.id;

      // wait for auth to fully hydrate
      await new Promise((r) => setTimeout(r, 800));

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!data?.role) {
        return;
      }

      const role = data.role.toLowerCase();

      if (role === "washer") router.replace("/queue");
      else if (role === "cashier") router.replace("/pos");
      else router.replace("/dashboard");
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

      console.log("SETUP RESULT:", result);

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

  if (!mounted) return null;

  return (
    <main
      className="
    min-h-screen
    bg-[#020617]
    text-white
    flex
    items-center
    justify-center
    px-4
    py-6
    overflow-hidden
  "
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 h-[450px] w-[450px] rounded-full bg-cyan-500/20 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-500/20 blur-[160px]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      {/* MAIN CARD */}
      <div
        className="
      relative z-10
      w-full max-w-7xl
      h-[92vh]
      overflow-hidden
      rounded-[40px]
      border border-white/10
      bg-white/[0.03]
      backdrop-blur-2xl
      shadow-[0_25px_120px_rgba(0,0,0,0.55)]
      grid grid-cols-1 xl:grid-cols-2
    "
      >
        {/* LEFT SIDE */}

        <div
          className="
            hidden
            xl:flex
            flex-col
            justify-between
            border-r border-white/10
            bg-gradient-to-br
            from-cyan-500/10
            via-transparent
            to-fuchsia-500/10
            p-12
          "
        >
          <div>
            {/* LOGO */}

            <div className="flex items-center gap-5">
              <div
                className="
                  flex
                  h-24
                  w-24
                  items-center
                  justify-center
                  rounded-[28px]
                  border border-cyan-400/20
                  bg-cyan-500/10
                "
              >
                <Car className="h-11 w-11 text-cyan-400" />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl xl:text-5xl font-black">
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
        <div className=" flex flex-col h-full overflow-y-auto px-5 py-8 sm:px-8 lg:px-10 xl:px-12 ">
          <div
            className="
    flex
    flex-col
    p-5
    sm:p-8
    lg:p-10
    xl:p-12
    overflow-y-auto
  "
          >
            {/* MOBILE BRAND */}

            <div className="mb-10 flex xl:hidden items-center gap-4">
              <div
                className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-3xl
                border border-cyan-500/20
                bg-cyan-500/10
              "
              >
                <Car className="h-8 w-8 text-cyan-400" />
              </div>

              <div>
                <h1 className="text-3xl font-black">WashFlow Pro</h1>

                <p className="text-sm text-gray-400">Smart Wash System</p>
              </div>
            </div>

            {/* HEADER */}

            <div className="mb-8">
              <div
                className="
      inline-flex
      items-center
      gap-2
      rounded-full
      border
      border-cyan-400/20
      bg-cyan-500/10
      px-4
      py-2
      text-xs
      font-semibold
      tracking-wide
      text-cyan-300
      backdrop-blur-xl
      "
              >
                <Sparkles className="h-4 w-4" />
                Enterprise Carwash Platform
              </div>

              <h2
                className="
      mt-5
      text-3xl
      sm:text-4xl
      xl:text-5xl
      font-black
      leading-[1.05]
      tracking-tight
      "
              >
                {isLogin ? (
                  <>
                    Welcome Back to
                    <span
                      className="
            block
            mt-2
            bg-gradient-to-r
            from-cyan-300
            via-sky-400
            to-blue-500
            bg-clip-text
            text-transparent
          "
                    >
                      WashFlow Pro
                    </span>
                  </>
                ) : (
                  <>
                    Create Your
                    <span
                      className="
            block
            mt-2
            bg-gradient-to-r
            from-cyan-300
            via-sky-400
            to-blue-500
            bg-clip-text
            text-transparent
          "
                    >
                      Carwash Account
                    </span>
                  </>
                )}
              </h2>

              <p
                className="
      mt-4
      max-w-xl
      text-sm
      sm:text-base
      xl:text-lg
      leading-relaxed
      text-slate-400
      "
              >
                {isLogin
                  ? "Access your dashboard, manage staff, track revenue and monitor carwash operations in real time."
                  : "Launch your carwash business with powerful POS, vehicle tracking, staff management, queue control and advanced reporting."}
              </p>
            </div>

            {/* ALERTS */}

            {errorMessage && (
              <div
                className="
                mb-5
                rounded-2xl
                border border-red-500/20
                bg-red-500/10
                px-5 py-4
                text-sm
                text-red-300
              "
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                className="
                mb-5
                flex
                items-center
                gap-2
                rounded-2xl
                border border-emerald-500/20
                bg-emerald-500/10
                px-5 py-4
                text-sm
                text-emerald-300
              "
              >
                <CheckCircle2 className="h-4 w-4" />

                {successMessage}
              </div>
            )}

            {/* FORM */}

            <div className="max-w-xl mx-auto w-full">
              <div className="space-y-4">
                {/* FULL NAME */}

                {!isLogin && (
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Full Name
                    </label>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="
                      h-12 md:h-14
                      w-full
                      rounded-2xl
                      border border-white/10
                      bg-[#0B1220]
                      pl-12
                      pr-4
                      text-white
                      outline-none
                      transition-all
                      focus:border-cyan-400
                    "
                      />
                    </div>
                  </div>
                )}

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="
                    h-12 md:h-14
                    w-full
                    rounded-2xl
                    border border-white/10
                    bg-[#0B1220]
                    pl-12
                    pr-4
                    text-white
                    outline-none
                    transition-all
                    focus:border-cyan-400
                  "
                    />
                  </div>
                </div>

                {!isLogin && (
                  <>
                    {/* location */}
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">
                        Location
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter branch location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-12 md:h-14 w-full rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white focus:border-cyan-400 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-400">
                        Phone Number
                      </label>

                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 md:h-14 w-full rounded-2xl border border-white/10 bg-[#0B1220] px-4 text-white focus:border-cyan-400 outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {!isLogin && (
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Carwash Name
                    </label>

                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                      <input
                        type="text"
                        placeholder="Enter carwash name"
                        value={carwashName}
                        onChange={(e) => setCarwashName(e.target.value)}
                        className="
                      h-12 md:h-14
                      w-full
                      rounded-2xl
                      border border-white/10
                      bg-[#0B1220]
                      pl-12
                      pr-4
                      text-white
                      outline-none
                      transition-all
                      focus:border-cyan-400
                      "
                      />
                    </div>
                  </div>
                )}

                {/* PASSWORD */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        isLogin ? "current-password" : "new-password"
                      }
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="
                    h-12 md:h-14
                    w-full
                    rounded-2xl
                    border border-white/10
                    bg-[#0B1220]
                    pl-12
                    pr-14
                    text-white
                    outline-none
                    transition-all
                    focus:border-cyan-400
                  "
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                    hover:text-cyan-400
                  "
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {!isLogin && password && (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                        <span>Password Strength</span>

                        <span>
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
                            className={`
                              h-2
                              flex-1
                              rounded-full
                              ${
                                passwordStrength >= bar
                                  ? "bg-cyan-400"
                                  : "bg-white/10"
                              }
                            `}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* REMEMBER */}

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="h-4 w-4"
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* SUBMIT */}

                <button
                  onClick={isLogin ? handleLogin : handleSignup}
                  disabled={loading}
                  className="
                flex
                h-12 md:h-14
                w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-cyan-400
                text-lg
                font-bold
                text-white
                transition-all
                hover:bg-cyan-500
                disabled:opacity-60
                shadow-[0_0_35px_rgba(0,255,255,0.25)]
              "
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? "Login" : "Create Account"}

                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                {/* SWITCH */}

                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);

                      setErrorMessage("");

                      setSuccessMessage("");
                    }}
                    className="
                  text-gray-400
                  transition-colors
                  hover:text-cyan-400
                "
                  >
                    {isLogin
                      ? "Don't have an account? Create one"
                      : "Already have an account? Login"}
                  </button>
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
      <div
        className="
          flex
          h-12 md:h-14
          w-14
          shrink-0
          items-center
          justify-center
          rounded-2xl
          border border-cyan-500/10
          bg-cyan-500/10
        "
      >
        <Icon className="h-6 w-6 text-cyan-400" />
      </div>

      <div>
        <h3 className="text-lg md:text-xl xl:text-2xl font-bold text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm md:text-base xl:text-lg leading-relaxed text-gray-400">
          {text}
        </p>
      </div>
    </div>
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
    <div
      className="
        rounded-3xl
        border border-white/10
        bg-white/[0.03]
        p-5
      "
    >
      <Icon className="h-6 w-6 text-cyan-400" />

      <h3 className="mt-4 text-2xl font-black text-white">{value}</h3>

      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}
