"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  getProfile,
  type Profile,
} from "@/lib/getProfile";

/* =========================================================
   AUTH CONTEXT TYPE
========================================================= */

type AuthContextType = {
  user: any;

  profile: Profile | null;

  /*
    ACTIVE BRANCH
  */
  currentBranch: string | null;

  /*
    ACTIVE COMPANY / TENANT
  */
  currentCompany: string | null;

  /*
    USER ROLE
  */
  role: string | null;

  /*
    HELPERS
  */
  isAdmin: boolean;

  isManager: boolean;

  isCashier: boolean;

  isWasher: boolean;

  isCustomer: boolean;

  /*
    LOADING
  */
  loading: boolean;
};

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext =
  createContext<AuthContextType>({
    user: null,

    profile: null,

    currentBranch: null,

    currentCompany: null,

    role: null,

    isAdmin: false,

    isManager: false,

    isCashier: false,

    isWasher: false,

    isCustomer: false,

    loading: true,
  });

/* =========================================================
   HOOK
========================================================= */

export const useAuth = () =>
  useContext(AuthContext);

/* =========================================================
   PROVIDER
========================================================= */

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
    AUTH USER
  */
  const [user, setUser] =
    useState<any>(null);

  /*
    PROFILE
  */
  const [profile, setProfile] =
    useState<Profile | null>(
      null
    );

  /*
    ACTIVE BRANCH
  */
  const [
    currentBranch,
    setCurrentBranch,
  ] = useState<string | null>(
    null
  );

  /*
    ACTIVE COMPANY
  */
  const [
    currentCompany,
    setCurrentCompany,
  ] = useState<string | null>(
    null
  );

  /*
    USER ROLE
  */
  const [role, setRole] =
    useState<string | null>(
      null
    );

  /*
    LOADING
  */
  const [loading, setLoading] =
    useState(true);

  /* =========================================================
     RESET AUTH STATE
  ========================================================= */

  const resetAuth = () => {
    setUser(null);

    setProfile(null);

    setCurrentBranch(null);

    setCurrentCompany(null);

    setRole(null);
  };

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  const loadProfile =
    async () => {
      try {
        console.log(
          "LOADING PROFILE..."
        );

        const profileData =
          await getProfile();

        if (!profileData) {
          console.warn(
            "NO PROFILE FOUND"
          );

          resetAuth();

          return;
        }

        console.log(
          "PROFILE LOADED:",
          profileData
        );

        /*
          SAVE PROFILE
        */
        setProfile(profileData);

        /*
          ACTIVE BRANCH
        */
        setCurrentBranch(
          profileData.branch_id ||
            null
        );

        /*
          ACTIVE COMPANY
        */
        setCurrentCompany(
          profileData.carwash_id ||
            profileData.company_id ||
            null
        );

        /*
          ROLE
        */
        setRole(
          profileData.role ||
            null
        );
      } catch (err) {
        console.error(
          "LOAD PROFILE FAILED:",
          err
        );

        resetAuth();
      }
    };

  /* =========================================================
     INITIALIZE SESSION
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const initialize =
      async () => {
        try {
          setLoading(true);

          const {
            data: { session },
            error,
          } =
            await supabase.auth.getSession();

          if (error) {
            console.error(
              "SESSION ERROR:",
              error
            );

            return;
          }

          console.log(
            "INITIAL SESSION:",
            session
          );

          /*
            NO SESSION
          */
          if (!session?.user) {
            resetAuth();

            return;
          }

          /*
            SET USER
          */
          if (mounted) {
            setUser(
              session.user
            );
          }

          /*
            LOAD PROFILE
          */
          await loadProfile();
        } catch (err) {
          console.error(
            "INITIALIZE ERROR:",
            err
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    initialize();

    /* =====================================================
       AUTH LISTENER
    ===================================================== */

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          console.log(
            "AUTH EVENT:",
            event
          );

          /*
            SIGNED OUT
          */
          if (
            event ===
              "SIGNED_OUT" ||
            !session?.user
          ) {
            resetAuth();

            return;
          }

          /*
            SIGNED IN
            TOKEN REFRESH
          */
          if (
            event ===
              "SIGNED_IN" ||
            event ===
              "TOKEN_REFRESHED" ||
            event ===
              "USER_UPDATED"
          ) {
            setLoading(true);

            try {
              setUser(
                session.user
              );

              await loadProfile();
            } catch (err) {
              console.error(
                err
              );
            } finally {
              setLoading(false);
            }
          }
        }
      );

    return () => {
      mounted = false;

      listener.subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     ROLE HELPERS
  ========================================================= */

  const isAdmin =
    role === "admin";

  const isManager =
    role === "manager";

  const isCashier =
    role === "cashier";

  const isWasher =
    role === "washer";

  const isCustomer =
    role === "customer";

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <AuthContext.Provider
      value={{
        user,

        profile,

        currentBranch,

        currentCompany,

        role,

        isAdmin,

        isManager,

        isCashier,

        isWasher,

        isCustomer,

        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}