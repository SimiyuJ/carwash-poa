"use client";

export default function RecentActivity({ data = [] }: any) {
  if (!data || data.length === 0) return null;

  return (
    <div
      className="
        relative rounded-2xl overflow-hidden
        bg-[#020617]
        border border-white/10
        shadow-lg
        p-5
      "
    >
      {/* 🎨 GRADIENT OVERLAY (matches cards/hero) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-cyan-600/10" />

      {/* 🔲 SUBTLE GRID */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10">
        {/* TITLE */}
        <h2 className="text-white font-semibold mb-4">
          Recent Activity
        </h2>

        {/* LIST */}
        <div className="space-y-3">
          {data.map((item: any, i: number) => (
            <div
              key={i}
              className="
                flex justify-between items-start
                text-sm
                p-3 rounded-lg
                hover:bg-white/5
                transition
              "
            >
              {/* LEFT */}
              <div>
                <p className="text-white font-medium">
                  {item.title}
                </p>
                <p className="text-gray-400 text-xs">
                  {item.detail}
                </p>
              </div>

              {/* RIGHT */}
              <span className="text-gray-500 text-xs whitespace-nowrap">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}