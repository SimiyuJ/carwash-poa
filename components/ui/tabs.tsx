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
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;

  className?: string;
}

export function Tabs({
  children,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  className = "",
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const value = controlledValue ?? internalValue;

  const setValue = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider
      value={{
        value,
        setValue,
      }}
    >
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
      className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,.25)] backdrop-blur-xl transition-all ${className} `}
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
      data-state={active ? "active" : "inactive"}
      onClick={() => setValue(value)}
      className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
        active
          ? `bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_25px_rgba(34,211,238,.25)]`
          : `text-slate-400 hover:bg-white/[0.05] hover:text-white`
      } ${className} `}
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
