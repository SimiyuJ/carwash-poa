import Dexie, { Table } from "dexie";

/* ================================
   TABLE TYPES
================================ */

export interface OfflineVehicle {
  id: string;

  plate_number: string;

  customer_id: string;

  vehicle_type_id?: string;

  customers?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };

  updated_at?: string;
}

export interface OfflineSubscription {
  id: string;

  vehicle_id: string;

  customer_id: string;

  carwash_id: string;

  branch_id: string;

  status: string;

  plan?: string;

  usage?: number;

  limit?: number;

  renewal?: string;

  services?: any;

  updated_at?: string;
}

export interface OfflineReward {
  id: string;

  customer_id: string;

  branch_id: string;

  reward_id: string;

  status: string;

  unlocked_at: string;

  loyalty_rewards: any;

  customer_points: number;

  updated_at: string;
}

export interface PendingTransaction {
  id: string;

  type:
    | "invoice"
    | "payment"
    | "queue"
    | "reward"
    | "customer"
    | "vehicle"
    | "subscription";

  payload: any;

  status: "pending" | "syncing" | "synced" | "failed";

  retries: number;

  created_at: string;

  updated_at: string;
}

export interface OfflineCustomer {
  id: string;

  name: string;

  phone?: string;

  email?: string;

  loyalty_points?: number;

  updated_at?: string;
}

export interface OfflineInvoice {
  id: string;

  status: "pending" | "synced";

  payload: any;

  created_at: string;
}

export interface OfflineQueueJob {
  id: string;

  status: "pending" | "synced";

  payload: any;

  created_at: string;
}

/* ================================
   DATABASE
================================ */

class WashFlowDB extends Dexie {
  vehicles!: Table<OfflineVehicle>;

  subscriptions!: Table<OfflineSubscription>;

  rewards!: Table<OfflineReward>;

  services!: Table<any>;

  servicePrices!: Table<any>;

  vehicleTypes!: Table<any>;

  membershipPlans!: Table<any>;

  branches!: Table<any>;

  carwashes!: Table<any>;

  loyaltyTransactions!: Table<any>;

  loyaltyCustomerRewards!: Table<any>;

  pendingTransactions!: Table<PendingTransaction>;

  customers!: Table<OfflineCustomer>;

  invoices!: Table<OfflineInvoice>;

  queue!: Table<OfflineQueueJob>;

  constructor() {
    super("WashFlowOffline");

    this.version(4).stores({
      vehicles: "id,plate_number",

      subscriptions: "id,vehicle_id,customer_id,status",

      rewards: "id,[customer_id+branch_id],customer_id,branch_id,status",

      services: "id",

      servicePrices: "id,service_id,vehicle_type_id",

      vehicleTypes: "id",

      membershipPlans: "id",

      branches: "id",

      carwashes: "id",

      loyaltyTransactions: "id,customer_id",

      loyaltyCustomerRewards: "id,customer_id,status",

      pendingTransactions: "id,status,type,created_at",

      customers: "id,name,phone",

      invoices: "id,status",

      queue: "id,status",
    });
  }
}

export const offlineDB = new WashFlowDB();
