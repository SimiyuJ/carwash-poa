"use client";

export default function PopularServices({ services }: any) {
  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-white/10">
      <h2 className="text-white font-semibold mb-4">
        Popular Services — This Month
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {services.map((s: any) => (
          <div key={s.name} className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white font-semibold">{s.name}</p>

            <div className="flex justify-between text-sm text-gray-400">
              <span>{s.count} washes</span>
              <span>{s.revenue}</span>
            </div>

            <div className="h-2 bg-gray-700 rounded mt-2">
              <div
                className="h-2 bg-cyan-400 rounded"
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}