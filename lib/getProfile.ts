"use client";

import { supabase } from "@/lib/supabase";

/* =========================================================
   USER ROLES
========================================================= */

export type UserRole = "admin" | "manager" | "cashier" | "washer" | "customer";

/* =========================================================
   PROFILE TYPE
========================================================= */

export type Profile = {
  id: string;

  email: string;

  full_name?: string | null;

  role: UserRole;

  /*
    PRIMARY TENANT ID
  */
  carwash_id?: string | null;

  /*
    LEGACY SUPPORT
  */
  company_id?: string | null;

  tenant_id?: string | null;

  /*
    ACTIVE BRANCH
  */
  branch_id?: string | null;

  created_at?: string;

  updated_at?: string;

  branch?: {
    id: string;
    name: string;
  } | null;

  carwash?: {
    id: string;
    name: string;
  } | null;
};

/* =========================================================
   VALID ROLES
========================================================= */

const VALID_ROLES: UserRole[] = [
  "admin",
  "manager",
  "cashier",
  "washer",
  "customer",
];

/* =========================================================
   SAFE ROLE
========================================================= */

function normalizeRole(role?: string | null): UserRole {
  if (role && VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }

  return "customer";
}

/* =========================================================
   NORMALIZE PROFILE
========================================================= */

function normalizeProfile(profile: any): Profile {
  const tenantId =
    profile?.carwash_id || profile?.company_id || profile?.tenant_id || null;

  return {
    ...profile,

    role: normalizeRole(profile?.role),

    /*
      FORCE ALL TENANT IDS
      TO MATCH
    */
    carwash_id: tenantId,

    company_id: tenantId,

    tenant_id: tenantId,

    branch_id: profile?.branch_id || null,
  };
}

/* =========================================================
   GET PROFILE
========================================================= */

export async function getProfile(): Promise<Profile | null> {
  try {
    /* =====================================================
       GET SESSION
    ===================================================== */

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("SESSION ERROR:", sessionError.message);

      return null;
    }

    if (!session?.user) {
      console.warn("NO ACTIVE SESSION");

      return null;
    }

    const user = session.user;

    const email = user.email?.toLowerCase();

    if (!email) {
      console.warn("USER EMAIL MISSING");

      return null;
    }
    /* =====================================================
       FETCH PROFILE
    ===================================================== */

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE FETCH ERROR:", profileError.message);

      return null;
    }

    /* =====================================================
       PROFILE EXISTS
    ===================================================== */

    if (existingProfile) {
      let profile = normalizeProfile(existingProfile);

      /*
        PROFILE MISSING TENANT
      */

      if (!profile.carwash_id) {
        console.warn("PROFILE MISSING TENANT");

        const { data: invite } = await supabase
          .from("invites")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        if (invite?.carwash_id) {
          const tenantId = invite.carwash_id;

          const { data: fixedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({
              carwash_id: tenantId,

              company_id: tenantId,

              tenant_id: tenantId,

              branch_id: invite.branch_id || null,

              role: normalizeRole(invite.role),
            })
            .eq("id", user.id)
            .select("*")
            .single();

          if (updateError) {
            console.error(updateError.message);
          }

          if (fixedProfile) {
            profile = normalizeProfile(fixedProfile);
          }
        }
      }

      /*
        STAFF AUTO BRANCH
      */

      const isStaff = profile.role !== "customer";

      if (isStaff && !profile.branch_id) {
        console.warn("STAFF HAS NO BRANCH");

        const { data: branch } = await supabase
          .from("branches")
          .select("id")
          .eq("company_id", profile.carwash_id)
          .limit(1)
          .maybeSingle();

        if (branch?.id) {
          const { data: updatedBranchProfile } = await supabase
            .from("profiles")
            .update({
              branch_id: branch.id,
            })
            .eq("id", user.id)
            .select("*")
            .single();

          if (updatedBranchProfile) {
            profile = normalizeProfile(updatedBranchProfile);
          }
        }
      }

      return profile;
    }

    /* =====================================================
       NO PROFILE → CHECK INVITES
    ===================================================== */

    console.warn("NO PROFILE FOUND");

    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (inviteError) {
      console.error("INVITE ERROR:", inviteError.message);

      return null;
    }

    if (!invite) {
      console.warn("NO INVITE FOUND");

      return null;
    }

    const tenantId = invite.carwash_id || invite.company_id || invite.tenant_id;

    if (!tenantId) {
      console.error("INVITE HAS NO TENANT");

      return null;
    }

    /* =====================================================
       CREATE PROFILE
    ===================================================== */

    const profilePayload = {
      id: user.id,

      email,

      full_name:
        user.user_metadata?.full_name || user.user_metadata?.name || "",

      role: normalizeRole(invite.role),

      /*
        FORCE ALL IDS
      */
      carwash_id: tenantId,

      company_id: tenantId,

      tenant_id: tenantId,

      branch_id: invite.branch_id || null,
    };

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert(profilePayload)
      .select("*")
      .single();

    if (createError) {
      console.error("PROFILE CREATE ERROR:", createError.message);

      return null;
    }

    /*
      MARK INVITE USED
    */

    if (invite.id) {
      await supabase
        .from("invites")
        .update({
          used: true,
        })
        .eq("id", invite.id);
    }

    const normalized = normalizeProfile(createdProfile);

    return normalized;
  } catch (error: any) {
    console.error("GET PROFILE FATAL ERROR:", error?.message || error);

    return null;
  }
}

/* =========================================================
   ROLE HELPERS
========================================================= */

export function isAdmin(role?: string) {
  return role === "admin";
}

export function isManager(role?: string) {
  return role === "manager";
}

export function isCashier(role?: string) {
  return role === "cashier";
}

export function isWasher(role?: string) {
  return role === "washer";
}

export function isCustomer(role?: string) {
  return role === "customer";
}

export function isStaff(role?: string) {
  return ["admin", "manager", "cashier", "washer"].includes(role || "");
}

/* =========================================================
   TENANT HELPERS
========================================================= */

export function hasTenant(profile?: Profile | null) {
  return !!(profile?.carwash_id || profile?.company_id || profile?.tenant_id);
}

export function hasBranch(profile?: Profile | null) {
  return !!profile?.branch_id;
}

export function canAccessBranch(
  profile: Profile | null,
  branchId?: string | null,
) {
  if (!profile) return false;

  if (profile.role === "admin") {
    return true;
  }

  return profile.branch_id === branchId;
}
