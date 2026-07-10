"use client";

import { usePathname, useRouter } from "next/navigation";

import { LayoutDashboard, Car, CalendarDays, Star, Menu } from "lucide-react";

const items = [
  {
    title: "Home",
    icon: LayoutDashboard,
    href: "/customer/dashboard",
  },
  {
    title: "Vehicles",
    icon: Car,
    href: "/customer/vehicles",
  },
  {
    title: "Bookings",
    icon: CalendarDays,
    href: "/customer/bookings",
  },
  {
    title: "Loyalty",
    icon: Star,
    href: "/customer/loyalty",
  },
  {
    title: "More",
    icon: Menu,
    href: "/customer/menu",
  },
];

export default function CustomerBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div
        className="
        fixed
        bottom-4
        left-4
        right-4

        z-50

        rounded-3xl

        border
        border-cyan-500/10

        bg-[#07142B]/95
        backdrop-blur-2xl

        shadow-[0_10px_40px_rgba(0,0,0,.45)]

        px-2
        py-2

        flex
        items-center
        justify-around
      "
      >
        {items.map((item) => {
          const Icon = item.icon;

          const active = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="
              relative
              flex
              flex-col
              items-center
              justify-center

              flex-1

              py-2

              transition-all
              duration-300
            "
            >
              {active && (
                <div
                  className="
                  absolute
                  inset-x-2
                  top-1
                  bottom-1

                  rounded-2xl

                  bg-gradient-to-r
                  from-cyan-500
                  to-blue-600

                  shadow-lg
                  shadow-cyan-500/30
                "
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`h-6 w-6 transition-all duration-300 ${
                    active ? "text-white scale-110" : "text-slate-400"
                  }`}
                />

                <span
                  className={`mt-1 text-[11px] font-medium ${
                    active ? "text-white" : "text-slate-400"
                  }`}
                >
                  {item.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
