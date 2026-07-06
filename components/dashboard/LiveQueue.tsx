"use client";

export default function LiveQueue({ queue = [] }: any) {
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
      {/* 🎨 CYAN OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-blue-600/10 to-indigo-600/10" />

      {/* GRID */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10">
        {/* TITLE */}
        <h2 className="text-cyan-300 font-semibold mb-4">
          Live Queue
        </h2>

        {/* ✅ EMPTY STATE */}
        {queue.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No vehicles in queue
          </p>
        ) : (
          <div className="space-y-2">
            {queue.map((item: any) => (
              <div
                key={item.position}
                className="
                  flex justify-between items-center
                  p-3 rounded-lg
                  bg-white/5
                  hover:bg-white/10
                  transition
                "
              >
                <div>
                  <p className="text-white font-semibold">
                    #{item.position} {item.vehicle}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {item.service}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-cyan-400 font-medium">
                    {item.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    ETA: {item.eta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM LINE */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 opacity-70" />
    </div>
  );
}