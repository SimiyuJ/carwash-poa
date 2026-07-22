import { useEffect, useState } from "react";

/* ===========================================
   NETWORK HELPERS
=========================================== */

export const isOnline = () => {
  if (typeof window === "undefined") return true;

  return navigator.onLine;
};

export const isOffline = () => !isOnline();

/* ===========================================
   REACT HOOK
=========================================== */

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
