"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CustomerLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        alert(error.message);
        return;
      }

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (
        profile?.role !==
        "customer"
      ) {
        alert(
          "This account is not a customer account."
        );

        await supabase.auth.signOut();

        return;
      }

      router.push(
        "/customer-profiles/dashboard"
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-md rounded-3xl">
        <CardContent className="p-8 space-y-5">
          <div>
            <h1 className="text-3xl font-bold">
              Customer Login
            </h1>

            <p className="text-muted-foreground mt-2">
              Access your customer dashboard
            </p>
          </div>

          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl"
          >
            {loading
              ? "Signing in..."
              : "Login"}
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-2xl"
            onClick={() =>
              router.push(
                "/customer-profiles/signup"
              )
            }
          >
            Create Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}