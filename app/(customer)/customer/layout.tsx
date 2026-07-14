"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { ActiveBranchProvider } from "@/components/providers/ActiveBranchProvider";
import CustomerSidebar from "@/components/customers/CustomerSidebar";
import CustomerBottomNav from "@/components/customers/CustomerBottomNav";

import { Menu } from "lucide-react";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /*
   * Pages that should NOT display the dashboard layout.
   */
  const fullscreenRoutes = [
    "/auth",
    "/signup",
    "/customer/auth",
    "/customer-signup",
    "/customer/select-carwash",
    "/customer/add-carwash",
  ];

  const isFullscreen = fullscreenRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ActiveBranchProvider>
      <div className="min-h-screen bg-[#081A33] overflow-x-hidden">
        {/* Sidebar */}
        {!isFullscreen && (
          <CustomerSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        )}

        {/* Mobile Menu */}
        {!isFullscreen && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="
              fixed
              top-4
              left-4
              z-[999]
              h-12
              w-12
              rounded-xl
              bg-cyan-500
              text-white
              shadow-lg
              flex
              items-center
              justify-center
              lg:hidden
            "
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {/* Main Content */}
        <main
          className={
            isFullscreen
              ? "min-h-screen w-full"
              : `
                min-h-screen
                transition-all
                duration-300
                overflow-x-hidden
                pb-24
                lg:pb-0
                ${
                  sidebarOpen
                    ? "lg:ml-72 lg:max-w-[calc(100vw-18rem)]"
                    : "lg:ml-20 lg:max-w-[calc(100vw-5rem)]"
                }
              `
          }
        >
          {children}
        </main>

        {!isFullscreen && !sidebarOpen && <CustomerBottomNav />}
      </div>
    </ActiveBranchProvider>
  );
}
