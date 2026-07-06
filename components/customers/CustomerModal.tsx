"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export type Tag =
  | "regular"
  | "vip"
  | "corporate"
  | "new";

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

  messageType:
  | "success"
  | "error"
  | "";

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

  const canManageCategories = [
    "staff",
    "manager",
    "admin",
    "owner",
  ].includes(role ?? "");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        className="
    bg-slate-950

    rounded-[2rem]
    p-6
    w-[700px]
    max-w-full
    space-y-4

    border
    border-white/10

    shadow-[0_20px_80px_rgba(0,0,0,0.7)]

    max-h-[90vh]
    overflow-y-auto
  "
      >
        <h2 className="text-2xl font-bold text-white">
          {editingCustomer
            ? "Edit Customer"
            : "Add Vehicles"}
        </h2>

        {/* ================= CUSTOMER DETAILS ================= */}

        <div className="rounded-3xl border bg-white/[0.03] border-white/10 backdrop-blur-md p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-white">
              Customer Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Customer Name *
              </label>

              <Input
                placeholder="e.g. John Mwangi"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="
  h-12
  rounded-2xl

  bg-slate-800/80
  border-white/10

  text-white
  placeholder:text-slate-500

  focus:border-cyan-400
"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Phone Number *
              </label>

              <Input
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="
    h-12
    rounded-2xl
    bg-slate-800/80
    border-white/10
    text-white
    placeholder:text-slate-500
    focus:border-cyan-400
  "
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-300">
                Email Address
              </label>

              <Input
                placeholder="e.g. john@gmail.com (optional)"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="
    h-12
    rounded-2xl
    bg-slate-800/80
    border-white/10
    text-white
    placeholder:text-slate-500
    focus:border-cyan-400
  "
              />
            </div>
          </div>
        </div>

        {canManageCategories && (
          <div
            className="
      rounded-3xl
      border
      border-white/10
      bg-slate-900/60
      backdrop-blur-md
      p-5
      space-y-4
    "
          >
            <div>
              <h3 className="font-semibold text-white">
                Customer Category
              </h3>

              <p className="text-sm text-slate-400">
                Select the customer classification.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "regular",
                "vip",
                "corporate",
                "new",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t as Tag)}
                  className={`
            px-4
            py-2
            rounded-2xl
            text-sm
            font-medium
            transition-all

            ${tag === t
                      ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.35)]"
                      : "bg-slate-800/80 border border-white/10 text-white hover:border-cyan-400"
                    }
          `}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border bg-white/[0.03] border-white/10 backdrop-blur-md bg-slate-900/60  backdrop-blur-md p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-white">
              Vehicle Details
            </h3>

            <p className="text-sm text-slate-500">
              Register the customer's primary vehicle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Registration Number
              </label>

              <Input
                placeholder="e.g. KDA 123A"
                value={plate}
                onChange={(e) =>
                  setPlate(
                    e.target.value.toUpperCase()
                  )
                }
                className="
  h-12
  rounded-2xl

  bg-slate-800/80
  border-white/10

  text-white
  placeholder:text-slate-500

  focus:border-cyan-400
"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Vehicle Type
              </label>

              <select
                value={vehicleType}
                onChange={(e) =>
                  setVehicleType(
                    e.target.value
                  )
                }
                className="
                  w-full
                  h-11
                  rounded-2xl
                  border
                  border-slate-200
                  px-3
                  bg-slate-800/80
                  text-white
                  border-white/10
                  focus:outline-none
                  focus:ring-2
                  focus:ring-cyan-500
                "
              >
                <option value="Sedan">
                  Sedan
                </option>
                <option value="Hatchback">
                  Hatchback
                </option>
                <option value="SUV">
                  SUV
                </option>
                <option value="Pickup">
                  Pickup
                </option>
                <option value="Truck">
                  Truck
                </option>
                <option value="Van">
                  Van
                </option>
                <option value="Bus">
                  Bus
                </option>
                <option value="Motorcycle">
                  Motorcycle
                </option>
                <option value="Trailer">
                  Trailer
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-300">
                Vehicle Color
              </label>

              <Input
                placeholder="e.g. Black"
                value={color}
                onChange={(e) =>
                  setColor(
                    e.target.value
                  )
                }
                className="
  h-12
  rounded-2xl

  bg-slate-800/80
  border-white/10

  text-white
  placeholder:text-slate-500

  focus:border-cyan-400
"
              />
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
              ${messageType ===
                "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
              }
            `}
          >
            {messageType ===
              "success" ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 mt-0.5" />
            )}

            <span className="text-sm font-medium">
              {message}
            </span>
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
  );
}