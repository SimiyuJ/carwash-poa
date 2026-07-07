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
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-950
        via-[#07142B]
        to-black

        flex
        items-center
        justify-center

        p-6
      "
    >
      <div className="w-full max-w-6xl">
        {/* HEADER */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div
            className="
              inline-flex
              items-center
              gap-2

              px-4 py-2

              rounded-full

              bg-cyan-500/10
              border
              border-cyan-500/20

              text-cyan-300
              text-sm
            "
          >
            <Sparkles className="h-4 w-4" />
            Welcome to CarWash POS
          </div>

          <h1 className="text-5xl font-black text-white mt-6">
            Create Your Account
          </h1>

          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            Choose the type of account you want to create.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* CUSTOMER */}

          <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.25 }}>
            <Card
              className="
                h-full

                rounded-[34px]

                border
                border-cyan-500/20

                bg-[#07142B]

                overflow-hidden
              "
            >
              <CardContent className="p-10">
                <div
                  className="
                    w-20
                    h-20

                    rounded-3xl

                    bg-gradient-to-br
                    from-cyan-500
                    to-blue-600

                    flex
                    items-center
                    justify-center
                  "
                >
                  <Car className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-3xl font-black text-white mt-8">
                  Customer Account
                </h2>

                <p className="text-slate-400 mt-5 leading-7">
                  Register as a customer to:
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Book car wash appointments",
                    "Manage multiple vehicles",
                    "Purchase subscriptions",
                    "Earn loyalty points",
                    "Redeem rewards",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-slate-300"
                    >
                      <ShieldCheck className="h-5 w-5 text-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => router.push("/customer-signup")}
                  className="
                    w-full
                    h-14

                    mt-10

                    rounded-2xl

                    bg-gradient-to-r
                    from-cyan-500
                    to-blue-600

                    text-lg
                    font-bold
                  "
                >
                  Continue as Customer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* STAFF */}

          <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.25 }}>
            <Card
              className="
                h-full

                rounded-[34px]

                border
                border-yellow-500/20

                bg-[#07142B]

                overflow-hidden
              "
            >
              <CardContent className="p-10">
                <div
                  className="
                    w-20
                    h-20

                    rounded-3xl

                    bg-gradient-to-br
                    from-yellow-500
                    to-orange-600

                    flex
                    items-center
                    justify-center
                  "
                >
                  <Building2 className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-3xl font-black text-white mt-8">
                  Car Wash Business
                </h2>

                <p className="text-slate-400 mt-5 leading-7">
                  Register your business and:
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Create your car wash",
                    "Manage branches",
                    "Create staff accounts",
                    "Manage subscriptions",
                    "Access POS & reports",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-slate-300"
                    >
                      <ShieldCheck className="h-5 w-5 text-yellow-400" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => router.push("/auth?mode=signup")}
                  className="
                    w-full
                    h-14

                    mt-10

                    rounded-2xl

                    bg-gradient-to-r
                    from-yellow-500
                    to-orange-600

                    text-lg
                    font-bold
                  "
                >
                  Register Car Wash
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => router.push("/auth")}
            className="text-slate-400 hover:text-cyan-400 transition"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
