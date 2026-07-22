import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Profile } from "@/types/profile";

export interface Branch {
  id: string;
  name: string;
  location?: string;
  phone?: string;
}

export interface Service {
  id: string;
  name: string;
  price?: number;
  category_id?: string;
}

export interface VehicleType {
  id: string;
  name: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role?: string;
}

interface AppStore {
  // ===========================
  // Global Data
  // ===========================

  profile: Profile | null;

  branches: Branch[];

  services: Service[];

  vehicleTypes: VehicleType[];

  staff: StaffMember[];

  // Generic cache for any query
  queryCache: Record<string, any>;

  // ===========================
  // Loading State
  // ===========================

  initialized: boolean;

  // ===========================
  // Actions
  // ===========================

  setInitialized: (value: boolean) => void;

  setProfile: (profile: Profile | null) => void;

  setBranches: (branches: Branch[]) => void;

  setServices: (services: Service[]) => void;

  setVehicleTypes: (vehicleTypes: VehicleType[]) => void;

  setStaff: (staff: StaffMember[]) => void;

  setCache: (key: string, value: any) => void;

  getCache: <T = any>(key: string) => T | undefined;

  removeCache: (key: string) => void;

  clearQueryCache: () => void;

  clearStore: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ===========================
      // State
      // ===========================

      profile: null,

      branches: [],

      services: [],

      vehicleTypes: [],

      staff: [],

      queryCache: {},

      initialized: false,

      // ===========================
      // Actions
      // ===========================

      setInitialized: (value) =>
        set({
          initialized: value,
        }),

      setProfile: (profile) =>
        set({
          profile,
        }),

      setBranches: (branches) =>
        set({
          branches,
        }),

      setServices: (services) =>
        set({
          services,
        }),

      setVehicleTypes: (vehicleTypes) =>
        set({
          vehicleTypes,
        }),

      setStaff: (staff) =>
        set({
          staff,
        }),

      setCache: (key, value) =>
        set((state) => ({
          queryCache: {
            ...state.queryCache,
            [key]: value,
          },
        })),

      getCache: (key) => get().queryCache[key],

      removeCache: (key) =>
        set((state) => {
          const cache = { ...state.queryCache };

          delete cache[key];

          return {
            queryCache: cache,
          };
        }),

      clearQueryCache: () =>
        set({
          queryCache: {},
        }),

      clearStore: () =>
        set({
          profile: null,
          branches: [],
          services: [],
          vehicleTypes: [],
          staff: [],
          queryCache: {},
          initialized: false,
        }),
    }),
    {
      name: "washflow-cache",
    },
  ),
);
