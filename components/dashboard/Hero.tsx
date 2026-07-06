"use client";

export default function Hero() {
  return (
    <div
      className="
        relative rounded-2xl overflow-hidden p-8
        border border-white/10
        bg-[#020617]
        shadow-lg
      "
    >
      {/* 🔲 GRID PATTERN (unchanged, just slightly clearer) */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-cyan-600/10" />

      {/* SOFT GLOW (kept, slightly refined) */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full" />

      {/* CONTENT */}
      <div className="relative z-10">
        <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
          Live Overview
        </p>

        <h1 className="text-3xl font-extrabold text-white">
          Good afternoon,{" "}
          <span className="text-cyan-400">Admin</span>
        </h1>

        <p className="text-sm text-gray-300 mt-2 max-w-md">
          Your wash operations are running smoothly.
        </p>
      </div>
    </div>
  );
}