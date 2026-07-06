"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      {...props}
      className={cn(
        `
        flex h-11 w-full rounded-xl
        border border-white/10
        bg-white
        px-4 py-2
        text-sm text-black
        placeholder:text-gray-400

        shadow-sm
        transition-all duration-200

        focus:outline-none
        focus:border-cyan-400
        focus:ring-2 focus:ring-cyan-400/20

        hover:border-white/20

        disabled:opacity-50
        disabled:cursor-not-allowed
        `,
        className
      )}
    />
  );
});

Input.displayName = "Input";

export { Input };