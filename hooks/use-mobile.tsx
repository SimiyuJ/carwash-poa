"use client";

import * as React from "react";

/* =========================================================
   BREAKPOINT
========================================================= */

const MOBILE_BREAKPOINT = 768;

/* =========================================================
   HOOK
========================================================= */

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // SSR SAFETY
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );

    /* INITIAL CHECK */
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    handleResize();

    /* LISTENERS */
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleResize);
    } else {
      // SAFARI SUPPORT
      mediaQuery.addListener(handleResize);
    }

    /* CLEANUP */
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleResize);
      } else {
        mediaQuery.removeListener(handleResize);
      }
    };
  }, []);

  return isMobile;
}