"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

type SelectContextType = {
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = React.createContext<SelectContextType | null>(null);

function useSelect() {
  const context = React.useContext(SelectContext);

  if (!context) {
    throw new Error("Select components must be inside Select");
  }

  return context;
}

interface SelectProps {
  children: React.ReactNode;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Select({
  children,
  defaultValue = "",
  onValueChange,
}: SelectProps) {
  const [value, setValueState] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const setValue = (newValue: string) => {
    setValueState(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <SelectContext.Provider
      value={{
        value,
        setValue,
        open,
        setOpen,
      }}
    >
      <div ref={wrapperRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = useSelect();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-11 w-full items-center justify-between rounded-2xl border border-zinc-800 bg-black px-4 text-sm text-white transition-all hover:border-zinc-700 ${className}`}
    >
      <div className="truncate">{children}</div>

      <ChevronDown
        className={`h-4 w-4 text-zinc-400 transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

export function SelectValue({
  placeholder,
}: {
  placeholder?: string;
}) {
  const { value } = useSelect();

  return (
    <span className="text-white">
      {value || placeholder || "Select"}
    </span>
  );
}

export function SelectContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open } = useSelect();

  if (!open) return null;

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95">
      <div className="max-h-72 overflow-y-auto p-2">
        {children}
      </div>
    </div>
  );
}

export function SelectItem({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) {
  const { value: selectedValue, setValue } = useSelect();

  const active = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-all ${
        active
          ? "bg-cyan-500/20 text-cyan-400"
          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
      }`}
    >
      <span>{children}</span>

      {active && <Check className="h-4 w-4" />}
    </button>
  );
}