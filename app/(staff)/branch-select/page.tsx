"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, MapPin } from "lucide-react";

/* =====================================================
   TYPES
===================================================== */

type Branch = {
  id: string;
  name: string;
  location: string;
  phone?: string;
  carwash_id: string;
};

type Profile = {
  id: string;
  carwash_id: string;
  branch_id: string | null;
  role: string;
};

/* =====================================================
   PAGE
===================================================== */

export default function BranchSelectPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  /* =====================================================
     FETCH USER + BRANCHES
  ===================================================== */

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      /* -----------------------------
         GET PROFILE
      ----------------------------- */

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

      if (profileError || !profileData) {
        router.replace("/login");
        return;
      }

      setProfile(profileData);

      /* -----------------------------
         FETCH BRANCHES BY TENANT
      ----------------------------- */

      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("carwash_id", profileData.carwash_id)
        .order("created_at", { ascending: false });

      setBranches(branchData || []);

      setLoading(false);
    };

    init();
  }, [router]);

  /* =====================================================
     SELECT BRANCH
  ===================================================== */

  const selectBranch = async (branch: Branch) => {
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        branch_id: branch.id,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("Failed to set branch:", error.message);
      setSaving(false);
      return;
    }

    /* OPTIONAL: refresh session context */
    await supabase.auth.refreshSession();

    setSaving(false);

    router.replace("/dashboard");
  };

  /* =====================================================
     LOADING STATE
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-400" />
          <p className="text-zinc-400">Loading branches...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">
            Select Your Branch
          </h1>
          <p className="text-zinc-400 mt-2">
            Choose a branch to continue working inside the system
          </p>
        </div>

        {/* BRANCH LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className="bg-zinc-950 border border-zinc-800 hover:border-cyan-500/40 transition cursor-pointer"
              onClick={() => selectBranch(branch)}
            >
              <CardContent className="p-5 space-y-3">

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">
                      {branch.name}
                    </h3>

                    <p className="text-zinc-400 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {branch.location}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-zinc-500">
                  Phone: {branch.phone || "N/A"}
                </div>

                <Button
                  disabled={saving}
                  className="w-full mt-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {saving ? "Selecting..." : "Select Branch"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* EMPTY STATE */}
        {branches.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            No branches found for this car wash
          </div>
        )}
      </div>
    </div>
  );
}