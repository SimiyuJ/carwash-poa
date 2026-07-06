"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import {
  Building2,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Database,
  Wallet,
  Save,
  Globe,
  Phone,
  Mail,
  Moon,
  Sun,
  ChevronRight,
  Activity,
  Receipt,
  Landmark,
  ImageIcon,
  Percent,
  RefreshCw,
  Wifi,
  WifiOff,
  Cloud,
  MonitorCog,
  Clock3,
  Languages,
  QrCode,
  BadgePercent,
  Gift,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent } from "@/components/ui/card";

/* =========================================
   DEFAULT SETTINGS
========================================= */

const DEFAULT_SETTINGS = {
  id: "",
  branch_id: null,

  business_name: "My Car Wash",
  phone: "",
  email: "",
  website: "",
  address: "Nairobi, Kenya",

  operating_hours: {
    mon: "08:00-18:00",
    tue: "08:00-18:00",
    wed: "08:00-18:00",
    thu: "08:00-18:00",
    fri: "08:00-18:00",
    sat: "09:00-17:00",
    sun: "closed",
  },

  currency: "KES",
  tax_percentage: 16,

  receipt_footer: "Thank you for your business!",

  receipt_logo_enabled: true,
  receipt_qr_enabled: false,

  mpesa_paybill: "",
  company_logo: "",

  dark_mode: false,

  notifications: true,
  sms_notifications: false,
  email_notifications: true,
  whatsapp_notifications: false,

  auto_backup: true,
  mpesa_enabled: false,

  realtime_sync: true,
  offline_mode: false,

  timezone: "Africa/Nairobi",
  language: "en",

  maintenance_mode: false,

  loyalty_points_enabled: false,

  default_vehicle_status: "pending",

  default_payment_method: "cash",

  enable_discounts: true,
  enable_subscriptions: false,
};

/* =========================================
   SETTINGS CONTEXT
========================================= */

const SettingsContext = createContext<any>(null);

export function SettingsProvider({ children }: any) {
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadGlobalSettings();

    const channel = supabase
      .channel("global-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
        },
        (payload) => {
          if (payload.new) {
            setSettings(payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadGlobalSettings = async () => {
    try {
      const { data, error } = await supabase.rpc("get_or_create_settings");

      if (error) {
        console.error("❌ Global Settings Error:", error);

        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error("❌ Global Settings Fatal Error:", err);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);

/* =========================================
   SETTINGS TABS
========================================= */

const settingTabs = [
  {
    id: "business",
    title: "Business",
    icon: Building2,
  },

  {
    id: "payments",
    title: "Payments",
    icon: CreditCard,
  },

  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
  },

  {
    id: "appearance",
    title: "Appearance",
    icon: Palette,
  },

  {
    id: "security",
    title: "Security",
    icon: Shield,
  },

  {
    id: "system",
    title: "System",
    icon: Database,
  },
];

/* =========================================
   PAGE
========================================= */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [userRole] = useState("admin");

  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);

  /* =========================================
     LOAD SETTINGS
  ========================================= */

  useEffect(() => {
    loadSettings();

    const channel = setupRealtime();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_or_create_settings");

      if (error) {
        console.error("❌ Settings Load Error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return;
      }

      if (data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
        });
      }
    } catch (err) {
      console.error("❌ Fatal Settings Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     REALTIME
  ========================================= */

  const setupRealtime = () => {
    const channel = supabase.channel("settings-realtime");

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "system_settings",
      },
      (payload) => {
        if (payload.new) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...payload.new,
          });
        }
      },
    );

    channel.subscribe((status) => {});

    return channel;
  };

  /* =========================================
     SAVE SETTINGS
  ========================================= */

  const saveSettings = async () => {
    try {
      setSaving(true);

      if (!settings.id) {
        alert("Settings row missing");

        return;
      }

      const payload = {
        branch_id: settings.branch_id,

        business_name: settings.business_name,

        phone: settings.phone,

        email: settings.email,

        website: settings.website,

        address: settings.address,

        operating_hours: settings.operating_hours,

        currency: settings.currency,

        tax_percentage: Number(settings.tax_percentage),

        receipt_footer: settings.receipt_footer,

        receipt_logo_enabled: settings.receipt_logo_enabled,

        receipt_qr_enabled: settings.receipt_qr_enabled,

        mpesa_paybill: settings.mpesa_paybill,

        company_logo: settings.company_logo,

        dark_mode: settings.dark_mode,

        notifications: settings.notifications,

        sms_notifications: settings.sms_notifications,

        email_notifications: settings.email_notifications,

        whatsapp_notifications: settings.whatsapp_notifications,

        auto_backup: settings.auto_backup,

        mpesa_enabled: settings.mpesa_enabled,

        realtime_sync: settings.realtime_sync,

        offline_mode: settings.offline_mode,

        timezone: settings.timezone,

        language: settings.language,

        maintenance_mode: settings.maintenance_mode,

        loyalty_points_enabled: settings.loyalty_points_enabled,

        default_vehicle_status: settings.default_vehicle_status,

        default_payment_method: settings.default_payment_method,

        enable_discounts: settings.enable_discounts,

        enable_subscriptions: settings.enable_subscriptions,
      };

      const { data, error } = await supabase
        .from("system_settings")
        .update(payload)
        .eq("id", settings.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Save Error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        alert(error.message || "Failed to save settings");

        return;
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
      });

      alert("Settings updated successfully");
    } catch (err) {
      console.error("❌ Fatal Save Error:", err);

      alert("Unexpected error saving settings");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     ACCESS CONTROL
  ========================================= */

  const canEditPayments = userRole === "admin";

  const canEditSecurity = userRole === "admin";

  const canEditAppearance = userRole === "admin" || userRole === "manager";

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin mx-auto" />

          <p className="text-gray-400 mt-4">Loading Enterprise Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 space-y-8">
      {/* HEADER */}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="
              h-16 w-16 rounded-3xl
              bg-cyan-500/10
              border border-cyan-500/20
              flex items-center justify-center
            "
          >
            <MonitorCog className="h-8 w-8 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-4xl font-black text-white">
              Enterprise Settings
            </h1>

            <p className="text-gray-400 mt-1">
              Global business configuration engine
            </p>
          </div>
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="
            gap-2 rounded-2xl
            bg-cyan-400 hover:bg-cyan-500
            text-white px-6 py-6
            text-lg font-semibold
          "
        >
          <Save className="h-5 w-5" />

          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Realtime Sync"
          value={settings.realtime_sync ? "LIVE" : "OFF"}
          icon={RefreshCw}
        />

        <StatsCard title="Currency" value={settings.currency} icon={Wallet} />

        <StatsCard
          title="Tax Engine"
          value={`${settings.tax_percentage}%`}
          icon={Percent}
        />

        <StatsCard
          title="System Status"
          value={settings.maintenance_mode ? "MAINT" : "ACTIVE"}
          icon={Activity}
        />
      </div>

      {/* MAIN */}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* SIDEBAR */}

        <div className="xl:col-span-1">
          <Card className="rounded-3xl border-white/5 bg-[#040B1A]">
            <CardContent className="p-4">
              <div className="space-y-2">
                {settingTabs.map((tab) => {
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                          w-full flex items-center justify-between
                          rounded-2xl px-4 py-4 transition-all

                          ${
                            activeTab === tab.id
                              ? "bg-cyan-400 text-white"
                              : "bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]"
                          }
                        `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />

                        <span className="font-medium">{tab.title}</span>
                      </div>

                      <ChevronRight className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CONTENT */}

        <div className="xl:col-span-3 space-y-6">
          {activeTab === "business" && (
            <SettingsSection
              title="Business Configuration"
              description="Global enterprise business setup"
              icon={Building2}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SettingsInput
                  label="Business Name"
                  value={settings.business_name}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      business_name: e.target.value,
                    })
                  }
                  icon={Building2}
                />

                <SettingsInput
                  label="Phone"
                  value={settings.phone}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      phone: e.target.value,
                    })
                  }
                  icon={Phone}
                />

                <SettingsInput
                  label="Email"
                  value={settings.email}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      email: e.target.value,
                    })
                  }
                  icon={Mail}
                />

                <SettingsInput
                  label="Website"
                  value={settings.website}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      website: e.target.value,
                    })
                  }
                  icon={Globe}
                />

                <SettingsInput
                  label="Currency"
                  value={settings.currency}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      currency: e.target.value,
                    })
                  }
                  icon={Wallet}
                />

                <SettingsInput
                  label="Tax Percentage"
                  value={String(settings.tax_percentage)}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      tax_percentage: Number(e.target.value),
                    })
                  }
                  icon={Percent}
                />

                <SettingsInput
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      timezone: e.target.value,
                    })
                  }
                  icon={Clock3}
                />

                <SettingsInput
                  label="Language"
                  value={settings.language}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      language: e.target.value,
                    })
                  }
                  icon={Languages}
                />

                <SettingsInput
                  label="M-Pesa Paybill"
                  value={settings.mpesa_paybill}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      mpesa_paybill: e.target.value,
                    })
                  }
                  icon={Landmark}
                />

                <SettingsInput
                  label="Receipt Footer"
                  value={settings.receipt_footer}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      receipt_footer: e.target.value,
                    })
                  }
                  icon={Receipt}
                />

                <SettingsInput
                  label="Company Logo URL"
                  value={settings.company_logo}
                  onChange={(e: any) =>
                    setSettings({
                      ...settings,
                      company_logo: e.target.value,
                    })
                  }
                  icon={ImageIcon}
                />
              </div>
            </SettingsSection>
          )}

          {activeTab === "payments" && (
            <SettingsSection
              title="Payment Engine"
              description="Enterprise payment controls"
              icon={CreditCard}
            >
              {!canEditPayments && <AccessDenied />}

              {canEditPayments && (
                <div className="space-y-4">
                  <ToggleCard
                    title="Enable M-Pesa"
                    enabled={settings.mpesa_enabled}
                    icon={Landmark}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        mpesa_enabled: !settings.mpesa_enabled,
                      })
                    }
                  />

                  <ToggleCard
                    title="Enable Discounts"
                    enabled={settings.enable_discounts}
                    icon={BadgePercent}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        enable_discounts: !settings.enable_discounts,
                      })
                    }
                  />

                  <ToggleCard
                    title="Enable Subscriptions"
                    enabled={settings.enable_subscriptions}
                    icon={Gift}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        enable_subscriptions: !settings.enable_subscriptions,
                      })
                    }
                  />
                </div>
              )}
            </SettingsSection>
          )}

          {activeTab === "notifications" && (
            <SettingsSection
              title="Notifications Engine"
              description="Manage enterprise notifications"
              icon={Bell}
            >
              <div className="space-y-4">
                <ToggleCard
                  title="SMS Notifications"
                  enabled={settings.sms_notifications}
                  icon={Bell}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      sms_notifications: !settings.sms_notifications,
                    })
                  }
                />

                <ToggleCard
                  title="Email Notifications"
                  enabled={settings.email_notifications}
                  icon={Mail}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      email_notifications: !settings.email_notifications,
                    })
                  }
                />

                <ToggleCard
                  title="WhatsApp Notifications"
                  enabled={settings.whatsapp_notifications}
                  icon={Phone}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      whatsapp_notifications: !settings.whatsapp_notifications,
                    })
                  }
                />
              </div>
            </SettingsSection>
          )}

          {activeTab === "appearance" && (
            <SettingsSection
              title="Appearance Engine"
              description="Global dashboard appearance"
              icon={Palette}
            >
              {!canEditAppearance && <AccessDenied />}

              {canEditAppearance && (
                <div className="space-y-4">
                  <ToggleCard
                    title="Dark Mode"
                    enabled={settings.dark_mode}
                    icon={settings.dark_mode ? Moon : Sun}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        dark_mode: !settings.dark_mode,
                      })
                    }
                  />

                  <ToggleCard
                    title="Receipt Logo"
                    enabled={settings.receipt_logo_enabled}
                    icon={ImageIcon}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        receipt_logo_enabled: !settings.receipt_logo_enabled,
                      })
                    }
                  />

                  <ToggleCard
                    title="Receipt QR Code"
                    enabled={settings.receipt_qr_enabled}
                    icon={QrCode}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        receipt_qr_enabled: !settings.receipt_qr_enabled,
                      })
                    }
                  />
                </div>
              )}
            </SettingsSection>
          )}

          {activeTab === "security" && (
            <SettingsSection
              title="Security Engine"
              description="Enterprise security controls"
              icon={Shield}
            >
              {!canEditSecurity && <AccessDenied />}

              {canEditSecurity && (
                <div className="space-y-4">
                  <ToggleCard
                    title="Cloud Backup"
                    enabled={settings.auto_backup}
                    icon={Cloud}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        auto_backup: !settings.auto_backup,
                      })
                    }
                  />

                  <ToggleCard
                    title="Offline POS Mode"
                    enabled={settings.offline_mode}
                    icon={settings.offline_mode ? WifiOff : Wifi}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        offline_mode: !settings.offline_mode,
                      })
                    }
                  />

                  <ToggleCard
                    title="Maintenance Mode"
                    enabled={settings.maintenance_mode}
                    icon={Wrench}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        maintenance_mode: !settings.maintenance_mode,
                      })
                    }
                  />
                </div>
              )}
            </SettingsSection>
          )}

          {activeTab === "system" && (
            <SettingsSection
              title="System Engine"
              description="Core enterprise controls"
              icon={Database}
            >
              <div className="space-y-4">
                <ToggleCard
                  title="Realtime Sync"
                  enabled={settings.realtime_sync}
                  icon={RefreshCw}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      realtime_sync: !settings.realtime_sync,
                    })
                  }
                />

                <ToggleCard
                  title="Notifications"
                  enabled={settings.notifications}
                  icon={Bell}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      notifications: !settings.notifications,
                    })
                  }
                />

                <ToggleCard
                  title="Loyalty Points"
                  enabled={settings.loyalty_points_enabled}
                  icon={Gift}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      loyalty_points_enabled: !settings.loyalty_points_enabled,
                    })
                  }
                />
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================
   ACCESS DENIED
========================================= */

function AccessDenied() {
  return (
    <div
      className="
        rounded-2xl border border-red-500/10
        bg-red-500/5 p-5
      "
    >
      <h3 className="font-bold text-red-400">Access Restricted</h3>

      <p className="text-sm text-red-300/70 mt-2">
        Your role permissions do not allow editing this section.
      </p>
    </div>
  );
}

/* =========================================
   SETTINGS SECTION
========================================= */

function SettingsSection({ title, description, icon: Icon, children }: any) {
  return (
    <Card className="rounded-3xl border-white/5 bg-[#040B1A]">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">{title}</h2>

            <p className="text-gray-400 mt-2">{description}</p>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center">
            <Icon className="h-7 w-7 text-cyan-400" />
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}

/* =========================================
   SETTINGS INPUT
========================================= */

function SettingsInput({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
}: any) {
  const safeValue = value === null || value === undefined ? "" : String(value);

  return (
    <div>
      <p className="text-sm text-gray-400 mb-3">{label}</p>

      <div className="relative">
        {Icon && (
          <Icon
            className="
              absolute left-3 top-1/2
              -translate-y-1/2
              h-4 w-4 text-gray-400
            "
          />
        )}

        <Input
          type={type}
          value={safeValue}
          onChange={onChange}
          autoComplete="off"
          spellCheck={false}
          className="
            pl-10 h-12 rounded-2xl
            bg-[#0B1220]
            border-white/10
            text-white
            placeholder:text-gray-500
            focus:border-cyan-400
            focus:ring-cyan-400/20
          "
        />
      </div>
    </div>
  );
}

/* =========================================
   TOGGLE CARD
========================================= */

function ToggleCard({ title, enabled, onClick, icon: Icon }: any) {
  return (
    <div
      className="
        flex items-center justify-between
        rounded-2xl border border-white/5
        bg-white/[0.03] p-5
      "
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-cyan-400" />}

        <div>
          <h3 className="font-semibold text-white">{title}</h3>

          <p className="text-gray-400 text-sm mt-1">Configure this feature</p>
        </div>
      </div>

      <button
        onClick={onClick}
        className={`
          relative w-14 h-8 rounded-full transition-all

          ${enabled ? "bg-cyan-400" : "bg-white/10"}
        `}
      >
        <div
          className={`
            absolute top-1 h-6 w-6 rounded-full bg-white transition-all

            ${enabled ? "translate-x-7" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}

/* =========================================
   STATS CARD
========================================= */

function StatsCard({ title, value, icon: Icon }: any) {
  return (
    <div
      className="
        rounded-3xl border border-white/5
        bg-[#040B1A] p-6
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>

          <h2 className="text-4xl font-black text-white mt-2">{value}</h2>
        </div>

        <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center">
          <Icon className="h-7 w-7 text-cyan-400" />
        </div>
      </div>
    </div>
  );
}
