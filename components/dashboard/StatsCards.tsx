"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Car,
  Users,
  CreditCard,
  ListOrdered,
} from "lucide-react";

const icons = [Car, Users, CreditCard, ListOrdered];

// 🎨 Improved themes (with title color added)
const themes = [
  {
    bg: "from-blue-600/20 to-blue-900/40",
    icon: "text-blue-400",
    glow: "from-blue-500 to-cyan-400",
    title: "text-blue-200",
  },
  {
    bg: "from-purple-600/20 to-purple-900/40",
    icon: "text-purple-400",
    glow: "from-purple-500 to-pink-400",
    title: "text-purple-200",
  },
  {
    bg: "from-emerald-600/20 to-emerald-900/40",
    icon: "text-emerald-400",
    glow: "from-emerald-500 to-green-400",
    title: "text-emerald-200",
  },
  {
    bg: "from-orange-600/20 to-orange-900/40",
    icon: "text-orange-400",
    glow: "from-orange-500 to-yellow-400",
    title: "text-orange-200",
  },
];

export default function StatsCards({ stats = [] }: any) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  if (!stats || stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((item: any, i: number) => {
        const Icon = icons[i % icons.length];
        const theme = themes[i % themes.length];

        return (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onMouseMove={handleMove}
            className="relative group rounded-2xl p-[1px]"
          >
            {/* BORDER GLOW */}
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${theme.glow} opacity-0 group-hover:opacity-100 blur-sm transition`}
            />

            <Card
              className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-br from-[#020617] via-[#020617] to-[#020617]
                ${theme.bg}
                border border-white/10
                shadow-lg
                hover:shadow-2xl hover:scale-[1.03]
                transition-all duration-300
              `}
            >
              <CardContent className="p-5 relative">
                {/* CURSOR GLOW */}
                <div
                  className="pointer-events-none absolute w-40 h-40 rounded-full bg-white/10 blur-3xl transition"
                  style={{
                    left: pos.x - 80,
                    top: pos.y - 80,
                    opacity: hovered === i ? 1 : 0,
                  }}
                />

                {/* ICON */}
                <div
                  className={`absolute top-4 right-4 transition ${
                    hovered === i
                      ? "opacity-100 scale-110"
                      : "opacity-0 scale-90"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${theme.icon}`} />
                </div>

                {/* ✅ TITLE (FIXED COLOR) */}
                <p className={`text-sm font-semibold ${theme.title}`}>
                  {item.title}
                </p>

                {/* VALUE */}
                <h2 className="text-3xl font-bold mt-2 text-white tracking-tight">
                  {item.value}
                </h2>

                {/* CHANGE */}
                {item.change && (
                  <p
                    className={`text-xs mt-2 font-semibold ${
                      item.up
                        ? "text-emerald-400"
                        : "text-orange-400"
                    }`}
                  >
                    {item.change}
                  </p>
                )}

                {/* BOTTOM GLOW */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${theme.glow} opacity-70`}
                />
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}