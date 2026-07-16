"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPortal } from "react-dom";

import {
  User,
  Phone,
  Mail,
  Car,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Users,
  X,
  UserCircle2,
} from "lucide-react";

export type Tag = "regular" | "vip" | "corporate" | "new";

type CustomerModalProps = {
  role?: string;

  open: boolean;
  onClose: () => void;

  editingCustomer: any;

  name: string;
  setName: (value: string) => void;

  phone: string;
  setPhone: (value: string) => void;

  email: string;
  setEmail: (value: string) => void;

  tag: Tag;
  setTag: (value: Tag) => void;

  plate: string;
  setPlate: (value: string) => void;

  vehicleType: string;
  setVehicleType: (value: string) => void;

  color: string;
  setColor: (value: string) => void;

  loading: boolean;

  message: string;

  messageType: "success" | "error" | "";

  onSubmit: () => void;
};

export default function CustomerModal({
  role,

  open,
  onClose,

  editingCustomer,

  name,
  setName,

  phone,
  setPhone,

  email,
  setEmail,

  tag,
  setTag,

  plate,
  setPlate,

  vehicleType,
  setVehicleType,

  color,
  setColor,

  loading,

  message,
  messageType,

  onSubmit,
}: CustomerModalProps) {
  if (!open) return null;

  const canManageCategories = ["staff", "manager", "admin", "owner"].includes(
    role ?? "",
  );

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="
    fixed
    inset-0
    z-[9999]
    flex
    items-center
    justify-center
    bg-black/70
    backdrop-blur-md
    p-3
    sm:p-5
  "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
      relative
      w-full
      max-w-3xl
      max-h-[94vh]
      overflow-y-auto

      rounded-[32px]

      border
      border-cyan-500/15

      bg-gradient-to-br
      from-[#07142B]
      via-[#081A33]
      to-[#040B18]

      shadow-[0_35px_90px_rgba(0,0,0,.65)]

      scrollbar-thin
      scrollbar-thumb-cyan-500/20
    "
      >
        {/* Decorative Glow */}

        <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-[90px]" />

          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-500/10 blur-[100px]" />
        </div>

        {/* ================= HEADER ================= */}

        <div
          className="
        relative
        overflow-hidden

        border-b
        border-white/10

        px-5
        py-5

        sm:px-7
        sm:py-6
      "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center

              rounded-3xl

              border
              border-cyan-500/25

              bg-cyan-500/10
            "
              >
                <Users className="h-7 w-7 text-cyan-400" />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-400 font-bold">
                  CUSTOMER MANAGEMENT
                </p>

                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </h2>

                <p className="mt-2 text-sm text-slate-400 max-w-lg">
                  Register a customer together with their primary vehicle. This
                  helps speed up future bookings and loyalty rewards.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center

            rounded-2xl

            border
            border-white/10

            bg-white/5

            transition-all

            hover:border-cyan-500/30
            hover:bg-cyan-500/10
          "
            >
              <X className="h-5 w-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="relative p-4 sm:p-6 space-y-6">
          {/* =========================================================
    CUSTOMER DETAILS
========================================================= */}

          <div
            className="
    rounded-[30px]
    border
    border-white/10
    bg-gradient-to-br
    from-white/[0.05]
    to-white/[0.02]
    backdrop-blur-xl
    p-5
    sm:p-6
    space-y-6
  "
          >
            <div className="flex items-center gap-4">
              <div
                className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        border
        border-cyan-500/20
        bg-cyan-500/10
      "
              >
                <UserCircle2 className="h-6 w-6 text-cyan-400" />
              </div>

              <div>
                <h3 className="font-bold text-lg text-white">
                  Customer Details
                </h3>

                <p className="text-sm text-slate-400">
                  Enter the customer's personal information.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* NAME */}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Customer Name *
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Mwangi"
                    className="
            h-12
            rounded-2xl
            pl-12
            border-white/10
            bg-[#0E1B33]
            text-white
            placeholder:text-slate-500
            focus:border-cyan-400
            focus:ring-cyan-400/30
          "
                  />
                </div>
              </div>

              {/* PHONE */}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Phone Number *
                </label>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="
            h-12
            rounded-2xl
            pl-12
            border-white/10
            bg-[#0E1B33]
            text-white
            placeholder:text-slate-500
            focus:border-cyan-400
          "
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@email.com (optional)"
                    className="
            h-12
            rounded-2xl
            pl-12
            border-white/10
            bg-[#0E1B33]
            text-white
            placeholder:text-slate-500
            focus:border-cyan-400
          "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
    CUSTOMER CATEGORY
========================================================= */}

          {canManageCategories && (
            <div
              className="
      rounded-[30px]
      border
      border-white/10
      bg-gradient-to-br
      from-white/[0.05]
      to-white/[0.02]
      backdrop-blur-xl
      p-5
      sm:p-6
      space-y-5
    "
            >
              <div className="flex items-center gap-4">
                <div
                  className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          border
          border-amber-500/20
          bg-amber-500/10
        "
                >
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-white">
                    Customer Category
                  </h3>

                  <p className="text-sm text-slate-400">
                    Choose how this customer will be classified.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["regular", "vip", "corporate", "new"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t as Tag)}
                    className={`
            h-12
            rounded-2xl
            text-sm
            font-semibold
            transition-all
            duration-300

            ${
              tag === t
                ? `
                  bg-gradient-to-r
                  from-cyan-500
                  to-blue-600
                  text-white
                  shadow-[0_0_30px_rgba(34,211,238,.35)]
                `
                : `
                  border
                  border-white/10
                  bg-[#0E1B33]
                  text-slate-300
                  hover:border-cyan-400/40
                `
            }
          `}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
    VEHICLE DETAILS
========================================================= */}

          <div
            className="
    rounded-[30px]
    border
    border-white/10
    bg-gradient-to-br
    from-white/[0.05]
    to-white/[0.02]
    backdrop-blur-xl
    p-5
    sm:p-6
    space-y-6
  "
          >
            <div className="flex items-center gap-4">
              <div
                className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        border
        border-cyan-500/20
        bg-cyan-500/10
      "
              >
                <Car className="h-6 w-6 text-cyan-400" />
              </div>

              <div>
                <h3 className="font-bold text-lg text-white">
                  Primary Vehicle
                </h3>

                <p className="text-sm text-slate-400">
                  Register the customer's main vehicle.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* PLATE */}

              <div className="space-y-2">
                <label className="text-sm text-slate-300">
                  Registration Number
                </label>

                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <Input
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="KDA 123A"
                    className="
            h-12
            rounded-2xl
            pl-12
            border-white/10
            bg-[#0E1B33]
            text-white
          "
                  />
                </div>
              </div>

              {/* TYPE */}

              <div className="space-y-2">
                <label className="text-sm text-slate-300">Vehicle Type</label>

                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="
          h-12
          w-full
          rounded-2xl
          border
          border-white/10
          bg-[#0E1B33]
          px-4
          text-white
          focus:outline-none
          focus:ring-2
          focus:ring-cyan-500
        "
                >
                  <option>Sedan</option>
                  <option>Hatchback</option>
                  <option>SUV</option>
                  <option>Pickup</option>
                  <option>Truck</option>
                  <option>Van</option>
                  <option>Bus</option>
                  <option>Motorcycle</option>
                  <option>Trailer</option>
                  <option>Other</option>
                </select>
              </div>

              {/* COLOR */}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-slate-300">Vehicle Color</label>

                <div className="relative">
                  <Palette className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Black"
                    className="
            h-12
            rounded-2xl
            pl-12
            border-white/10
            bg-[#0E1B33]
            text-white
          "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= MESSAGE ================= */}

          {message && (
            <div
              className={`
              rounded-3xl
              p-4
              flex
              items-start
              gap-3
              border
              ${
                messageType === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }
            `}
            >
              {messageType === "success" ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 mt-0.5" />
              )}

              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          {/* ================= BUTTON ================= */}

          <Button
            onClick={onSubmit}
            disabled={loading}
            className="
            w-full
            bg-cyan-500
            hover:bg-cyan-600
            text-white
            rounded-2xl
            h-11
            transition-all
            duration-300
            hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]
          "
          >
            {loading
              ? "Saving..."
              : editingCustomer
                ? "Update Customer"
                : "Save Customer"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
