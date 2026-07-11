"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ActiveBranch = {
  id: string;
  name: string;
  carwashId: string;
  customerId: string;
};

type ActiveBranchContextType = {
  activeBranch: ActiveBranch | null;
  activeBranchId: string | null;
  activeBranchName: string | null;
  isReady: boolean;

  setActiveBranch: (branch: ActiveBranch | null) => void;
  clearActiveBranch: () => void;
};

const STORAGE_KEY = "active_branch";

const ActiveBranchContext = createContext<ActiveBranchContextType | undefined>(
  undefined,
);

export function ActiveBranchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeBranch, setActiveBranchState] = useState<ActiveBranch | null>(
    null,
  );

  const [isReady, setIsReady] = useState(false);

  /**
    
    * Hydrate from localStorage
      */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: ActiveBranch = JSON.parse(stored);

        if (parsed?.id) {
          setActiveBranchState(parsed);
        }
      }
    } catch (error) {
      console.error(
        "[ActiveCarwashProvider] Failed to load active carwash:",
        error,
      );
    } finally {
      setIsReady(true);
    }
  }, []);

  /**
    
    * Persist whenever activeCarwash changes
      */
  useEffect(() => {
    if (!isReady) return;

    try {
      if (activeBranch) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeBranch));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error(
        "[ActiveCarwashProvider] Failed to save active carwash:",
        error,
      );
    }
  }, [activeBranch, isReady]);

  const setActiveBranch = useCallback((branch: ActiveBranch | null) => {
    setActiveBranchState(branch);
  }, []);

  const clearActiveBranch = useCallback(() => {
    setActiveBranchState(null);
  }, []);

  const value = useMemo(
    () => ({
      activeBranch,
      activeBranchId: activeBranch?.id ?? null,
      activeBranchName: activeBranch?.name ?? null,
      isReady,
      setActiveBranch,
      clearActiveBranch,
    }),
    [activeBranch, isReady, setActiveBranch, clearActiveBranch],
  );

  return (
    <ActiveBranchContext.Provider value={value}>
      {children}
    </ActiveBranchContext.Provider>
  );
}

export function useActiveBranch() {
  const context = useContext(ActiveBranchContext);

  if (!context) {
    throw new Error("useActiveBranch must be used within ActiveBranchProvider");
  }

  return context;
}
