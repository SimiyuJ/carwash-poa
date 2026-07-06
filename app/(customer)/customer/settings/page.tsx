"use client";

import { useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Bell,
  Lock,
  Save,
  Car,
} from "lucide-react";

export default function CustomerSettingsPage() {
  const [form, setForm] = useState({
    name: "Janet Wamalwa",
    phone: "0712 345 678",
    location: "Nairobi CBD",
    notifications: true,
    password: "",
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log("Saved settings:", form);
    alert("Settings updated successfully 🚀");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0b1220] to-[#0a0f1a] text-white px-6 py-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <User className="w-6 h-6 text-blue-400" />
          Account Settings
        </h1>
        <p className="text-sm text-gray-400">
          Manage your profile and preferences
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PROFILE CARD */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="text-blue-400" />
            </div>
            <div>
              <p className="font-medium">{form.name}</p>
              <p className="text-xs text-gray-400">Customer Account</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {form.phone}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {form.location}
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-400" />
              2 Registered Cars
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="lg:col-span-2 space-y-4">
          {/* PERSONAL INFO */}
          <Section title="Personal Information" icon={<User className="w-4 h-4" />}>
            <Input
              label="Full Name"
              value={form.name}
              onChange={(v) => handleChange("name", v)}
            />

            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(v) => handleChange("phone", v)}
            />

            <Input
              label="Location"
              value={form.location}
              onChange={(v) => handleChange("location", v)}
            />
          </Section>

          {/* SECURITY */}
          <Section title="Security" icon={<Lock className="w-4 h-4" />}>
            <Input
              label="New Password"
              type="password"
              value={form.password}
              onChange={(v) => handleChange("password", v)}
              placeholder="••••••••"
            />
          </Section>

          {/* PREFERENCES */}
          <Section title="Preferences" icon={<Bell className="w-4 h-4" />}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-gray-400">
                  Receive booking updates and alerts
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.notifications}
                onChange={(e) =>
                  handleChange("notifications", e.target.checked)
                }
                className="w-5 h-5 accent-blue-500"
              />
            </div>
          </Section>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-medium"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="flex items-center gap-2 mb-4 text-sm font-medium">
        {icon}
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
      />
    </div>
  );
}