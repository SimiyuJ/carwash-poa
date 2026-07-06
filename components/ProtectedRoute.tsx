"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth");
        return;
      }

      if (
        allowedRoles &&
        user.role &&
        !allowedRoles.includes(user.role)
      ) {
        router.replace("/unauthorized");
      }
    }
  }, [user, loading]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}