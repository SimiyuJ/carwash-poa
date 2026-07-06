"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

/* =========================================
   CONTEXT TYPE (optional but recommended)
========================================= */

type AppContextType = {
  user: any;
  profile: any;
  currentBranch: string | null;
  currentCompany: string | null;
  role: string | null;

  setUser?: (val: any) => void;
  setProfile?: (val: any) => void;
  setCurrentBranch?: (val: string | null) => void;
  setCurrentCompany?: (val: string | null) => void;
  setRole?: (val: string | null) => void;
};

/* =========================================
   CONTEXT
========================================= */

const AppContext = createContext<AppContextType | null>(null);

/* =========================================
   PROVIDER
========================================= */

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        currentBranch,
        currentCompany,
        role,
        setUser,
        setProfile,
        setCurrentBranch,
        setCurrentCompany,
        setRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/* =========================================
   HOOK (IMPORTANT)
========================================= */

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
}