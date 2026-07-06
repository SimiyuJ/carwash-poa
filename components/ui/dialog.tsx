"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* =========================================
   ROOT
========================================= */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/* =========================================
   OVERLAY
========================================= */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      /* FULLSCREEN */
      "fixed inset-0 z-[9998]",

      /* DEEP DARK BACKGROUND */
      "bg-black/90",

      /* STRONG BLUR */
      "backdrop-blur-xl",

      /* SMOOTH OPEN/CLOSE */
      "data-[state=open]:animate-in",
      "data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0",
      "data-[state=open]:fade-in-0",

      className
    )}
    {...props}
  />
));

DialogOverlay.displayName =
  DialogPrimitive.Overlay.displayName;

/* =========================================
   CONTENT
========================================= */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(
  (
    {
      className,
      children,
      showCloseButton = true,
      ...props
    },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay />

      {/* CENTERED MODAL */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            /* SIZE */
            "relative w-full max-w-5xl",

            /* DEEP MODAL CARD */
            "bg-gradient-to-br from-slate-950 via-[#020617] to-black",

            /* BORDER */
            "border border-slate-800",

            /* ROUNDING */
            "rounded-3xl",

            /* TEXT */
            "text-white",

            /* STRONG SHADOW */
            "shadow-[0_35px_120px_rgba(0,0,0,0.9)]",

            /* INNER GLOW */
            "ring-1 ring-white/5",

            /* SPACING */
            "p-6 md:p-8",

            /* LAYOUT */
            "grid gap-6",

            /* SCROLL */
            "max-h-[92vh] overflow-visible",

            /* OPEN/CLOSE ANIMATION */
            "duration-200",
            "data-[state=open]:animate-in",
            "data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0",
            "data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95",
            "data-[state=open]:zoom-in-95",

            className
          )}
          {...props}
        >
          {/* CLOSE BUTTON */}
          {showCloseButton && (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-5 top-5",
                "flex items-center justify-center",

                /* SIZE */
                "h-11 w-11",

                /* STYLE */
                "rounded-2xl",
                "bg-slate-900",
                "border border-slate-700",

                /* EFFECT */
                "shadow-lg",
                "hover:bg-slate-800",
                "hover:border-slate-600",

                /* TRANSITION */
                "transition-all duration-200",

                /* ACCESSIBILITY */
                "focus:outline-none",
                "focus:ring-2 focus:ring-blue-500"
              )}
            >
              <X className="h-5 w-5 text-white" />
            </DialogPrimitive.Close>
          )}

          {/* CONTENT */}
          <div className="w-full">
            {children}
          </div>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  )
);

DialogContent.displayName =
  DialogPrimitive.Content.displayName;

/* =========================================
   HEADER
========================================= */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-2 text-left",
      className
    )}
    {...props}
  />
);

DialogHeader.displayName = "DialogHeader";

/* =========================================
   FOOTER
========================================= */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-3",
      "sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);

DialogFooter.displayName = "DialogFooter";

/* =========================================
   TITLE
========================================= */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Title
  >
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-3xl font-bold tracking-tight text-white",
      className
    )}
    {...props}
  />
));

DialogTitle.displayName =
  DialogPrimitive.Title.displayName;

/* =========================================
   DESCRIPTION
========================================= */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Description
  >
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm leading-relaxed text-slate-300",
      className
    )}
    {...props}
  />
));

DialogDescription.displayName =
  DialogPrimitive.Description.displayName;

/* =========================================
   EXPORTS
========================================= */
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};