"use client";

import { Dispatch, SetStateAction } from "react";
import { X, Car } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;

  plate: string;
  setPlate: Dispatch<SetStateAction<string>>;

  vehicleType: string;
  setVehicleType: Dispatch<SetStateAction<string>>;

  color: string;
  setColor: Dispatch<SetStateAction<string>>;

  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  requiresPhone: boolean;

  loading: boolean;

  message: string;
  messageType: "success" | "error" | "";

  onSubmit: () => void;
};

const vehicleTypes = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Van",
  "Pickup",
  "Truck",
  "Motorcycle",
];

export default function VehicleModal({
  open,
  onClose,
  plate,
  setPlate,
  vehicleType,
  setVehicleType,
  color,
  setColor,
  phone,
  setPhone,
  requiresPhone,
  loading,
  message,
  messageType,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/70 backdrop-blur-sm
        p-4
      "
    >
      <div
        className="
          w-full max-w-lg
          rounded-[32px]
          border border-[#1A2D4D]
          bg-[#07142B]
          shadow-2xl
        "
      >
        {/* HEADER */}
        <div
          className="
            flex items-center justify-between
            border-b border-white/10
            p-6
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                h-12 w-12
                rounded-2xl
                bg-cyan-500/10
                flex items-center justify-center
              "
            >
              <Car className="text-cyan-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                Add Vehicle
              </h2>

              <p className="text-slate-400 text-sm">
                Register a vehicle in your garage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="
              h-10 w-10
              rounded-xl
              bg-white/5
              hover:bg-white/10
              flex items-center justify-center
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">

          {/* PLATE */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Registration Number
            </label>

            <input
              value={plate}
              onChange={(e) =>
                setPlate(e.target.value.toUpperCase())
              }
              placeholder="KDA 123A"
              className="
                w-full
                h-14
                rounded-2xl
                border border-white/10
                bg-[#091A34]
                px-4
                text-white
                outline-none
                focus:border-cyan-500
              "
            />
          </div>

          {/* VEHICLE TYPE */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Vehicle Type
            </label>

            <select
              value={vehicleType}
              onChange={(e) =>
                setVehicleType(e.target.value)
              }
              className="
                w-full
                h-14
                rounded-2xl
                border border-white/10
                bg-[#091A34]
                px-4
                text-white
                outline-none
                focus:border-cyan-500
              "
            >
              {vehicleTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* COLOR */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Vehicle Color
            </label>

            <input
              value={color}
              onChange={(e) =>
                setColor(e.target.value)
              }
              placeholder="Black"
              className="
                w-full
                h-14
                rounded-2xl
                border border-white/10
                bg-[#091A34]
                px-4
                text-white
                outline-none
                focus:border-cyan-500
              "
            />
          </div>

          {/* MESSAGE */}
          {message && (
            <div
              className={`
                rounded-2xl
                p-4
                text-sm
                font-medium
                ${messageType === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                }
              `}
            >
              {message}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div
          className="
            border-t border-white/10
            p-6
            flex gap-3
          "
        >
          <button
            onClick={onClose}
            className="
              flex-1
              h-14
              rounded-2xl
              border border-white/10
              bg-white/5
              text-white
              hover:bg-white/10
            "
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={loading}
            className="
              flex-1
              h-14
              rounded-2xl
              bg-gradient-to-r
              from-cyan-500
              to-blue-600
              text-white
              font-bold
              disabled:opacity-50
            "
          >
            {loading
              ? "Saving..."
              : "Add Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}