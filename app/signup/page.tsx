"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Car,
  Building2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignupSelector() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-4 py-6 text-white">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-0 h-[450px] w-[450px] rounded-full bg-cyan-500/15 blur-[180px]" />

        <div className="absolute right-0 bottom-0 h-[450px] w-[450px] rounded-full bg-emerald-500/10 blur-[180px]" />

        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* HEADER */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />

            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-300 uppercase">
              WashFlow Pro
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-5xl">
            Choose Your Account
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
            Select how you'd like to use WashFlow Pro.
          </p>
        </motion.div>

        {/* CARDS */}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* CUSTOMER */}

          <motion.div whileHover={{ y: -5 }}>
            <Card className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl">
              <CardContent className="relative p-6">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-[90px]" />

                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                    <Car className="h-8 w-8 text-cyan-400" />
                  </div>

                  <h2 className="mt-5 text-2xl font-black text-white">
                    Customer
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Manage vehicles, subscriptions and loyalty rewards.
                  </p>

                  <div className="mt-6 space-y-3">
                    {[
                      "Book appointments",
                      "Manage vehicles",
                      "Earn rewards",
                      "Track subscriptions",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-sm text-slate-300"
                      >
                        <ShieldCheck className="h-4 w-4 text-cyan-400" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => router.push("/customer-signup")}
                    className="mt-8 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* BUSINESS */}

          <motion.div whileHover={{ y: -5 }}>
            <Card className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl">
              <CardContent className="relative p-6">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-[90px]" />

                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                    <Building2 className="h-8 w-8 text-emerald-400" />
                  </div>

                  <h2 className="mt-5 text-2xl font-black text-white">
                    Carwash Business
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Run your entire carwash operation from one dashboard.
                  </p>

                  <div className="mt-6 space-y-3">
                    {[
                      "Manage branches",
                      "Create staff",
                      "POS & invoices",
                      "Analytics & reports",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-sm text-slate-300"
                      >
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => router.push("/auth?mode=signup")}
                    className="mt-8 h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold"
                  >
                    Register Business
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FOOTER */}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/auth")}
            className="text-sm text-slate-400 transition hover:text-cyan-400"
          >
            Already have an account?
            <span className="ml-1 font-semibold text-cyan-400">
              Sign InJoin your preferred carwash, earn loyalty points, m
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
