"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import type { Profile } from "@/types/profile";

type AuthContextType = {
  user: any;
  profile: Profile | null;
  currentBranch: string | null;
  currentCompany: string | null;
  role: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  currentBranch: null,
  currentCompany: null,
  role: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);

  const [currentBranch, setCurrentBranch] = useState<string | null>(null);

  const [currentCompany, setCurrentCompany] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [role, setRole] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        setProfile(null);
        return;
      }

      setProfile(data);

      setCurrentBranch(data?.branch_id || null);

      setCurrentCompany(data?.company_id || null);

      setRole(data?.role || null);
    } catch (err) {}
  };

  /* =========================================================
     INITIAL SESSION
  ========================================================= */

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          return;
        }

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session.user);

        await loadProfile(session.user.id);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setCurrentBranch(null);
          setCurrentCompany(null);
          setRole(null);
          return;
        }

        setUser(session.user);

        setTimeout(() => {
          loadProfile(session.user.id);
        }, 0);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        currentBranch,
        currentCompany,
        role,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
