"use client";

import * as React from "react";

interface ProgressProps {
  value?: number;
  className?: string;
}

export function Progress({
  value = 0,
  className = "",
}: ProgressProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}