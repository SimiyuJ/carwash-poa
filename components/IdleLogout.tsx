"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const IDLE_TIME = 2 * 60 * 60 * 1000; // 2 hours

export default function IdleLogout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();

      window.location.href = "/auth";
    }, IDLE_TIME);
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}
