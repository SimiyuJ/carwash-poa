"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/getProfile";

type Role =
  | "admin"
  | "manager"
  | "cashier"
  | "washer";

export default function InviteFormPage() {
  /* =========================================
     FORM STATE
  ========================================= */
  const [email, setEmail] = useState("");

  const [role, setRole] =
    useState<Role>("cashier");

  const [branchId, setBranchId] =
    useState("");

  /* =========================================
     SYSTEM STATE
  ========================================= */
  const [carwashId, setCarwashId] =
    useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [inviteLink, setInviteLink] =
    useState("");

  /* =========================================
     LOAD PROFILE
  ========================================= */
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoadingProfile(true);

        const profile =
          await getProfile();

        if (!mounted) return;

        if (!profile?.carwash_id) {
          setError(
            "Your account is not linked to a carwash"
          );

          return;
        }

        setCarwashId(
          profile.carwash_id
        );

      } catch (err) {
        console.error(
          "PROFILE LOAD ERROR:",
          err
        );

        setError(
          "Failed to load account"
        );

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
     VALIDATE EMAIL
  ========================================= */
  function validateEmail(
    value: string
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value
    );
  }

  /* =========================================
     COPY INVITE LINK
  ========================================= */
  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(
        inviteLink
      );

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
        setError(
          "Email is required"
        );

        return;
      }

      if (
        !validateEmail(email)
      ) {
        setError(
          "Enter a valid email address"
        );

        return;
      }

      if (!carwashId) {
        setError(
          "Missing carwash ID"
        );

        return;
      }

      /* =========================================
         API REQUEST
      ========================================= */
      const res = await fetch(
        "/api/invite/send",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),

            role,

            branch_id:
              branchId || null,

            carwash_id:
              carwashId,
          }),
        }
      );

      /* =========================================
         SAFE JSON PARSE
      ========================================= */
      const contentType =
        res.headers.get(
          "content-type"
        );

      let data: any = null;

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        data = await res.json();
      } else {
        const text =
          await res.text();

        console.error(
          "NON JSON RESPONSE:",
          text
        );

        throw new Error(
          "Server returned invalid response"
        );
      }

      /* =========================================
         API ERROR
      ========================================= */
      if (!res.ok) {
        setError(
          data?.error ||
            "Failed to send invite"
        );

        return;
      }

      /* =========================================
         SUCCESS
      ========================================= */
      setSuccess(
        "Invite sent successfully"
      );

      if (data?.inviteLink) {
        setInviteLink(
          data.inviteLink
        );
      }

      console.log(
        "INVITE CREATED:",
        data
      );

      /* =========================================
         RESET FORM
      ========================================= */
      setEmail("");

      setRole("cashier");

      setBranchId("");

    } catch (err: any) {
      console.error(
        "INVITE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Network error occurred"
      );

    } finally {
      setSending(false);
    }
  }

  /* =========================================
     UI
  ========================================= */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-2xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Staff Invitations
          </h1>

          <p className="text-slate-400 mt-2">
            Invite staff members to
            your carwash workspace
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">

          {/* LOADING */}
          {loadingProfile && (
            <div className="flex items-center gap-3 text-slate-400">

              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

              <span>
                Loading account...
              </span>

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

            <label className="text-sm text-slate-400">
              Staff Email
            </label>

            <input
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 outline-none p-4 rounded-2xl"
            />

          </div>

          {/* ROLE */}
          <div className="space-y-2">

            <label className="text-sm text-slate-400">
              Staff Role
            </label>

            <select
              value={role}
              onChange={(e) =>
                setRole(
                  e.target
                    .value as Role
                )
              }
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 outline-none p-4 rounded-2xl"
            >
              <option value="admin">
                Admin
              </option>

              <option value="manager">
                Manager
              </option>

              <option value="cashier">
                Cashier
              </option>

              <option value="washer">
                Washer
              </option>
            </select>

          </div>

          {/* BRANCH */}
          <div className="space-y-2">

            <label className="text-sm text-slate-400">
              Branch ID
            </label>

            <input
              type="text"
              placeholder="Optional branch ID"
              value={branchId}
              onChange={(e) =>
                setBranchId(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 outline-none p-4 rounded-2xl"
            />

          </div>

          {/* CARWASH */}
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">

            <p className="text-xs text-slate-400">
              Current Carwash ID
            </p>

            <p className="mt-2 break-all text-green-400 font-medium">
              {carwashId ||
                "Not linked"}
            </p>

          </div>

          {/* INVITE LINK */}
          {inviteLink && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-4">

              <div>
                <p className="text-xs text-slate-400">
                  Invite Link
                </p>

                <p className="mt-2 text-sm break-all text-green-400">
                  {inviteLink}
                </p>
              </div>

              <button
                onClick={
                  copyInviteLink
                }
                className="bg-green-600 hover:bg-green-700 transition px-4 py-3 rounded-xl font-medium"
              >
                Copy Invite Link
              </button>

            </div>
          )}

          {/* SUBMIT */}
          <button
            onClick={sendInvite}
            disabled={
              sending ||
              loadingProfile
            }
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 transition p-4 rounded-2xl font-semibold text-lg"
          >
            {sending
              ? "Sending Invite..."
              : "Send Invite"}
          </button>

        </div>

      </div>

    </div>
  );
}