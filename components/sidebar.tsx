"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";

type SidebarContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-screen w-full">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error(
      "useSidebar must be used within SidebarProvider"
    );
  }

  return context;
}

/* ================= SIDEBAR ================= */
function Sidebar({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { open } = useSidebar();

  return (
    <aside
      className={`
    sticky top-0
    h-screen
    shrink-0
    bg-[#020817]
    text-white
    border-r
    border-white/10
    transition-all
    duration-300
    overflow-y-auto
    overflow-x-hidden
    ${open ? "w-64" : "w-20"}
    ${className}
  `}
    >
      {children}
    </aside>
  );
}

/* ================= EXPORTS ================= */
export { Sidebar };
export default Sidebar;

export function SidebarInset({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function SidebarContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col p-3 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {children}
    </div>
  );
}

export function SidebarGroupLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-2 px-2 text-xs font-bold uppercase tracking-wider text-cyan-400 ${className}`}
    >
      {children}
    </div>
  );
}

export function SidebarMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {children}
    </div>
  );
}

export function SidebarMenuItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}

export function SidebarMenuButton({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  if (asChild) {
    return <>{children}</>;
  }

  return (
    <button className="w-full">
      {children}
    </button>
  );
}

export function SidebarTrigger() {
  const { open, setOpen } = useSidebar();

  return (
    <button
      onClick={() => setOpen(!open)}
      className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white hover:bg-gray-100"
    >
      <PanelLeft size={20} />
    </button>
  );
}