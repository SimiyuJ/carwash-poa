"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Calendar,
  Shield,
  CreditCard,
  BarChart3,
  Settings,
  Wrench,
  Package,
  Wallet,
  Menu,
  X,
} from "lucide-react";

const menuItems = [
  {
    title: "MAIN",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "POS System",
        href: "/pos",
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        name: "Vehicles",
        href: "/vehicles",
        icon: Wrench,
      },
      {
        name: "Customers",
        href: "/customers",
        icon: Users,
      },
      {
        name: "Appointments",
        href: "/appointments",
        icon: Calendar,
      },
      {
        name: "Subscriptions",
        href: "/subscriptions",
        icon: Shield,
      },
      {
        name: "Services",
        href: "/services",
        icon: Settings,
      },
    ],
  },
  {
    title: "STAFF & MANAGEMENT",
    items: [
      {
        name: "Staff",
        href: "/staff",
        icon: Users,
      },
      {
        name: "Purchases",
        href: "/purchases",
        icon: Package,
      },
    ],
  },
  {
    title: "FINANCIAL",
    items: [
      {
        name: "Expenses",
        href: "/expenses",
        icon: Wallet,
      },
      {
        name: "Transactions",
        href: "/transactions",
        icon: CreditCard,
      },
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },
];

export default function AppSidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-[280px]
          bg-[#020817] border-r border-white/10
          transition-transform duration-300
          overflow-y-auto

          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white">
              WashPOS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Car Wash System
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* MENU */}
        <div className="p-4 space-y-8">
          {menuItems.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center gap-3
                        rounded-xl px-4 py-3
                        transition-all duration-200

                        ${
                          active
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 shrink-0" />

                      <span className="font-medium">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}