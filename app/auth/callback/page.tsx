"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vehicles");
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      Signing you in...
    </div>
  );
}