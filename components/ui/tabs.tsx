"use client";

import * as React from "react";

type TabsContextType = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextType | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used inside Tabs");
  }

  return context;
}

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}

export function Tabs({
  children,
  defaultValue,
  className = "",
}: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl bg-zinc-900 p-1 ${className}`}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function TabsTrigger({
  children,
  value,
  className = "",
}: TabsTriggerProps) {
  const { value: activeValue, setValue } = useTabs();

  const active = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-white text-black"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function TabsContent({
  children,
  value,
  className = "",
}: TabsContentProps) {
  const { value: activeValue } = useTabs();

  if (activeValue !== value) return null;

  return <div className={className}>{children}</div>;
}