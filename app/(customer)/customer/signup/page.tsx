"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CustomerSignupPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSignup() {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: name,
            role: "customer",
          },
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (!data.user) {
        alert("User creation failed");
        return;
      }

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email,
          full_name: name,
          role: "customer",
        });

      if (profileError) {
        console.error(profileError);
      }

      alert(
        "Account created successfully"
      );

      router.push(
        "/customer-profiles/login"
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
              Create Customer Account
            </h1>

            <p className="text-muted-foreground mt-2">
              Join the customer portal
            </p>
          </div>

          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

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
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-2xl"
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-2xl"
            onClick={() =>
              router.push(
                "/customer-profiles/login"
              )
            }
          >
            Already have an account?
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}