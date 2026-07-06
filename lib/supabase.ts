import { createClient } from "@supabase/supabase-js";

/* =========================================
   ENV VARIABLES
========================================= */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* =========================================
   VALIDATE ENV
========================================= */

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/* =========================================
   CREATE SINGLETON CLIENT
========================================= */

const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,

      autoRefreshToken: true,

      detectSessionInUrl: true,

      flowType: "pkce",

      storage: typeof window !== "undefined" ? window.localStorage : undefined,

      storageKey: "carwash-management-auth",
    },

    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },

    global: {
      headers: {
        "X-Client-Info": "carwash-management-system",
      },
    },
  });
};

/* =========================================
   GLOBAL SINGLETON
========================================= */

declare global {
  // eslint-disable-next-line no-var
  var __supabase: ReturnType<typeof createSupabaseClient> | undefined;
}

/* =========================================
   EXPORT SINGLE INSTANCE
========================================= */

export const supabase = globalThis.__supabase ?? createSupabaseClient();

/* =========================================
   PREVENT MULTIPLE CLIENTS
========================================= */

if (process.env.NODE_ENV !== "production") {
  globalThis.__supabase = supabase;
}

/* =========================================
   CONNECTION DEBUGGING
========================================= */

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("SUPABASE: Internet reconnected");
  });

  window.addEventListener("offline", () => {
    console.warn("SUPABASE: Internet disconnected");
  });
}

/* =========================================
   SAFE AUTH RECOVERY
========================================= */

supabase.auth.onAuthStateChange(async (event) => {
  console.log("AUTH EVENT:", event);

  if (event === "SIGNED_OUT") {
    try {
      localStorage.removeItem("carwash-management-auth");
    } catch (error) {
      console.error("LOCAL STORAGE CLEAN ERROR:", error);
    }
  }
});
