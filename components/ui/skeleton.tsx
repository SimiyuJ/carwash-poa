import * as React from "react";
import { cn } from "@/lib/utils";

/* =========================================================
   SKELETON
========================================================= */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        `
        relative
        overflow-hidden
        rounded-xl

        bg-slate-800/70
        border
        border-slate-700/50

        animate-pulse

        before:absolute
        before:inset-0
        before:-translate-x-full
        before:animate-[shimmer_2s_infinite]

        before:bg-gradient-to-r
        before:from-transparent
        before:via-white/10
        before:to-transparent

        backdrop-blur-sm
        `,
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };