"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

/* =========================================================
   PROVIDER
========================================================= */

const TooltipProvider = TooltipPrimitive.Provider;

/* =========================================================
   ROOT
========================================================= */

const Tooltip = TooltipPrimitive.Root;

/* =========================================================
   TRIGGER
========================================================= */

const TooltipTrigger = TooltipPrimitive.Trigger;

/* =========================================================
   CONTENT
========================================================= */

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(
  (
    {
      className,
      sideOffset = 8,
      ...props
    },
    ref
  ) => (
    <TooltipPrimitive.Portal>

      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          `
          z-[9999]
          overflow-hidden

          rounded-xl
          border
          border-slate-700/60

          bg-[#020817]
          px-3
          py-2

          text-xs
          font-medium
          text-slate-200

          shadow-2xl
          backdrop-blur-xl

          transition-all
          duration-200

          origin-[--radix-tooltip-content-transform-origin]

          data-[state=open]:animate-in
          data-[state=closed]:animate-out

          data-[state=closed]:fade-out-0
          data-[state=open]:fade-in-0

          data-[state=closed]:zoom-out-95
          data-[state=open]:zoom-in-95

          data-[side=bottom]:slide-in-from-top-2
          data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2
          data-[side=top]:slide-in-from-bottom-2
          `,
          className
        )}
        {...props}
      />

    </TooltipPrimitive.Portal>
  )
);

TooltipContent.displayName =
  TooltipPrimitive.Content.displayName;

/* =========================================================
   EXPORTS
========================================================= */

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};