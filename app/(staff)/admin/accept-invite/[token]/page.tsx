"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

type Invite = {
  id: string;
  email: string;
  role: string;
  token: string;
  used: boolean;
  carwash_id: string;
  branch_id?: string | null;
};

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();

  const token = params?.token as string;

  const [invite, setInvite] = useState<Invite | null>(null);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================
     LOAD INVITE
  ========================================= */
  useEffect(() => {
    async function loadInvite() {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          setError("Missing invite token");
          return;
        }

        const { data, error } = await supabase
          .from("invites")
          .select("*")
          .eq("token", token)
          .eq("used", false)
          .maybeSingle();

        if (error) {
          console.error("INVITE LOAD ERROR:", error.message);

          setError("Failed to load invite");
          return;
        }

        if (!data) {
          setError("Invalid or expired invite");
          return;
        }

        setInvite(data as Invite);
      } catch (err: any) {
        console.error(err);

        setError("Unexpected error while loading invite");
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  /* =========================================
     ACCEPT INVITE
  ========================================= */
  async function acceptInvite() {
    try {
      setAccepting(true);
      setError("");

      if (!invite) {
        setError("Invite not found");
        return;
      }

      /* =========================================
         REQUIRE AUTH
      ========================================= */
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        setError("Please login first before accepting invite");

        router.push("/login");

        return;
      }

      /* =========================================
         EMAIL SAFETY CHECK
      ========================================= */
      if (
        user.email?.toLowerCase() !==
        invite.email?.toLowerCase()
      ) {
        setError(
          `This invite belongs to ${invite.email}`
        );

        return;
      }

      /* =========================================
         CHECK EXISTING PROFILE
      ========================================= */
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      /* =========================================
         CREATE PROFILE IF MISSING
      ========================================= */
      if (!existingProfile) {
        const { error: profileError } =
          await supabase.from("profiles").insert([
            {
              id: user.id,
              email: user.email,
              full_name:
                user.user_metadata?.full_name || "",
              role: invite.role,
              carwash_id: invite.carwash_id,
              branch_id: invite.branch_id || null,
            },
          ]);

        if (profileError) {
          console.error(
            "PROFILE CREATE ERROR:",
            profileError.message
          );

          setError("Failed to create user profile");

          return;
        }
      }

      /* =========================================
         MARK INVITE USED
      ========================================= */
      const { error: inviteError } = await supabase
        .from("invites")
        .update({
          used: true,
        })
        .eq("id", invite.id);

      if (inviteError) {
        console.error(
          "INVITE UPDATE ERROR:",
          inviteError.message
        );

        setError("Failed to finalize invite");

        return;
      }

      /* =========================================
         SUCCESS
      ========================================= */
      setSuccess("Invite accepted successfully");

      setTimeout(() => {
        router.replace("/dashboard");
      }, 1200);
    } catch (err: any) {
      console.error(err);

      setError("Unexpected error occurred");
    } finally {
      setAccepting(false);
    }
  }

  /* =========================================
     LOADING SCREEN
  ========================================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-400">
            Loading invite...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================
     ERROR SCREEN
  ========================================= */
  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 space-y-4">
          <h1 className="text-2xl font-bold text-red-400">
            Invite Error
          </h1>

          <p className="text-slate-300">
            {error}
          </p>

          <button
            onClick={() => router.push("/login")}
            className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded-xl font-medium"
          >
            Go To Login
          </button>
        </div>
      </div>
    );
  }

  /* =========================================
     MAIN PAGE
  ========================================= */
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">

        {/* HEADER */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">
            Accept Invite
          </h1>

          <p className="text-slate-400">
            Join your carwash workspace
          </p>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {/* ERROR */}
        {error && invite && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* INVITE DETAILS */}
        <div className="space-y-4">

          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400">
              Email
            </p>

            <p className="font-medium mt-1">
              {invite?.email}
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400">
              Role
            </p>

            <p className="font-medium mt-1 capitalize">
              {invite?.role}
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400">
              Carwash ID
            </p>

            <p className="font-medium mt-1 break-all">
              {invite?.carwash_id}
            </p>
          </div>

        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={acceptInvite}
          disabled={accepting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 transition p-4 rounded-2xl font-semibold text-lg"
        >
          {accepting
            ? "Accepting Invite..."
            : "Accept Invite"}
        </button>

      </div>
    </div>
  );
}