"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/getProfile";

type Role = "admin" | "manager" | "cashier" | "washer";

export default function AdminInvitesPage() {
  /* =========================================
     FORM STATE
  ========================================= */
  const [email, setEmail] = useState("");

  const [role, setRole] = useState<Role>("cashier");

  const [branchId, setBranchId] = useState("");

  /* =========================================
     SYSTEM STATE
  ========================================= */
  const [carwashId, setCarwashId] = useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [inviteLink, setInviteLink] = useState("");

  /* =========================================
     LOAD PROFILE
  ========================================= */
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoadingProfile(true);

        const profile = await getProfile();

        if (!mounted) return;

        if (!profile?.carwash_id) {
          setError("Your account is not linked to a carwash");

          return;
        }

        setCarwashId(profile.carwash_id);

        if (profile.branch_id) {
          setBranchId(profile.branch_id);
        }
      } catch (err) {
        console.error("PROFILE ERROR:", err);

        setError("Failed to load profile");
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================
     EMAIL VALIDATION
  ========================================= */
  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /* =========================================
     COPY LINK
  ========================================= */
  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);

      alert("Invite link copied");
    } catch (err) {
      console.error(err);
    }
  }

  /* =========================================
     SEND INVITE
  ========================================= */
  async function sendInvite() {
    try {
      setSending(true);

      setError("");
      setSuccess("");
      setInviteLink("");

      /* =========================================
         VALIDATION
      ========================================= */
      if (!email.trim()) {
        setError("Staff email is required");

        return;
      }

      if (!isValidEmail(email)) {
        setError("Invalid email address");

        return;
      }

      if (!carwashId) {
        setError("Missing carwash ID");

        return;
      }

      /* =========================================
         API REQUEST
      ========================================= */
      const res = await fetch("/api/invite/send", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim().toLowerCase(),

          role,

          branch_id: branchId || null,

          carwash_id: carwashId,
        }),
      });

      /* =========================================
         SAFE RESPONSE
      ========================================= */
      const contentType = res.headers.get("content-type");

      let data: any = null;

      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();

        console.error("INVALID RESPONSE:", text);

        throw new Error("Server returned invalid response");
      }

      /* =========================================
         ERROR
      ========================================= */
      if (!res.ok) {
        setError(data?.error || "Failed to send invite");

        return;
      }

      /* =========================================
         SUCCESS
      ========================================= */
      setSuccess("Invite created successfully");

      if (data?.inviteLink) {
        setInviteLink(data.inviteLink);
      }

      /* =========================================
         RESET
      ========================================= */
      setEmail("");

      setRole("cashier");
    } catch (err: any) {
      console.error("INVITE ERROR:", err);

      setError(err?.message || "Network error occurred");
    } finally {
      setSending(false);
    }
  }

  /* =========================================
     PAGE
  ========================================= */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Staff Invitations</h1>

          <p className="text-slate-400 mt-2">
            Invite staff members into your carwash workspace
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          {/* LOADING */}
          {loadingProfile && (
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

              <span>Loading profile...</span>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-2xl">
              {success}
            </div>
          )}

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Staff Email</label>

            <input
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 outline-none p-4 rounded-2xl"
            />
          </div>

          {/* ROLE */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Staff Role</label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 outline-none p-4 rounded-2xl"
            >
              <option value="admin">Admin</option>

              <option value="manager">Manager</option>

              <option value="cashier">Cashier</option>

              <option value="washer">Washer</option>
            </select>
          </div>

          {/* BRANCH */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Branch ID</label>

            <input
              type="text"
              placeholder="Optional branch ID"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 outline-none p-4 rounded-2xl"
            />
          </div>

          {/* CARWASH INFO */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <p className="text-xs text-slate-400">Current Carwash ID</p>

            <p className="mt-2 text-green-400 break-all font-medium">
              {carwashId || "Not linked"}
            </p>
          </div>

          {/* INVITE LINK */}
          {inviteLink && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-400">Invite Link</p>

                <p className="mt-2 text-sm text-green-400 break-all">
                  {inviteLink}
                </p>
              </div>

              <button
                onClick={copyInviteLink}
                className="bg-green-600 hover:bg-green-700 transition px-4 py-3 rounded-xl font-medium"
              >
                Copy Invite Link
              </button>
            </div>
          )}

          {/* SUBMIT */}
          <button
            onClick={sendInvite}
            disabled={sending || loadingProfile}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 transition p-4 rounded-2xl font-semibold text-lg"
          >
            {sending ? "Sending Invite..." : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
