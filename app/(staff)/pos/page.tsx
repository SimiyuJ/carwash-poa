"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import CustomerModal from "@/components/customers/CustomerModal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore, Branch } from "@/stores/app-store";
import { offlineDB } from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/network";
import { queueTransaction } from "@/lib/offline/offlineQueue";
import { useNetworkStatus } from "@/lib/offline/network";
import { syncSubscriptions } from "@/lib/offline/syncSubscriptions";
import { syncRewards } from "@/lib/offline/syncRewards";
import { syncManager } from "@/lib/offline/syncManager";

import {
  Droplets,
  Sparkles,
  Gem,
  Minus,
  User,
  TriangleAlert,
  Brush,
  SprayCan,
  Circle,
  Wind,
  Settings,
  Car,
  Receipt,
  CarFront,
  Building2,
  Search,
  Plus,
  Trash2,
  Printer,
  CreditCard,
  Wallet,
  Smartphone,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  PanelRightOpen,
  PanelRightClose,
  Activity,
  ShieldCheck,
  ShoppingCart,
  Gift,
  Star,
  Coins,
  BadgeCheck,
  TicketPercent,
  ChevronDown,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/* =========================================================
   ICON MAP
========================================================= */

const iconMap: any = {
  Droplets,
  Sparkles,
  Gem,
  Brush,
  SprayCan,
  Circle,
  Wind,
  Settings,
};

/* =========================================================
   PAGE
========================================================= */

export default function POSPage() {
  const { currentBranch, profile } = useAuth();

  /* =========================================================
     IDS
  ========================================================= */

  const branchId = currentBranch || profile?.branch_id;

  const companyId = profile?.carwash_id;

  const createdBy = profile?.id;

  const canOperate = !!branchId && !!companyId && !!createdBy;

  const { getCache, setCache, removeCache } = useAppStore();

  /* =========================================================
     CORE STATES
  ========================================================= */

  const [loading, setLoading] = useState(false);

  const [savingVehicle, setSavingVehicle] = useState(false);

  const [processingPayment, setProcessingPayment] = useState(false);

  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const router = useRouter();
  /* =========================================================
     BRANCHES
  ========================================================= */

  const [branches, setBranches] = useState<any[]>([]);

  const [currentBranchData, setCurrentBranchData] = useState<any>(null);

  /* =========================================================
     VEHICLES
  ========================================================= */

  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  const [vehicle, setVehicle] = useState<any>(null);

  const [plate, setPlate] = useState("");

  const [subscription, setSubscription] = useState<any>(null);

  /* =========================================================
     SEARCH
  ========================================================= */

  const [searchMessage, setSearchMessage] = useState("");

  const [searchType, setSearchType] = useState<
    "success" | "error" | "info" | ""
  >("");

  const [vehicleNotFound, setVehicleNotFound] = useState(false);

  /* =========================================================
     SERVICES
  ========================================================= */

  const [services, setServices] = useState<any[]>([]);

  const [serviceSearch, setServiceSearch] = useState("");

  const [activeVehicleType, setActiveVehicleType] = useState("");

  /* =========================================================
     CART
  ========================================================= */

  const [cart, setCart] = useState<any[]>([]);

  const [cartOpen, setCartOpen] = useState(false);

  const [subscriptionMode, setSubscriptionMode] = useState(false);

  /* =========================================================
     PAYMENT
  ========================================================= */

  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [discount, setDiscount] = useState(0);

  const [taxPercent, setTaxPercent] = useState(16);

  const [notes, setNotes] = useState("");

  /* =========================================================
     NEW VEHICLE
  ========================================================= */

  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const [customerName, setCustomerName] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");

  const [customerTag, setCustomerTag] = useState("regular");

  const [customerPlate, setCustomerPlate] = useState("");

  const [customerVehicleType, setCustomerVehicleType] = useState("");

  const [customerColor, setCustomerColor] = useState("");

  const [showAddVehicleCard, setShowAddVehicleCard] = useState(false);

  const [newCustomerName, setNewCustomerName] = useState("");

  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const [newVehiclePlate, setNewVehiclePlate] = useState("");

  const [newVehicleType, setNewVehicleType] = useState("");

  const [newVehicleColor, setNewVehicleColor] = useState("");

  /* =========================================================
      REWARDS
  ========================================================= */

  const [availableRewards, setAvailableRewards] = useState<any[]>([]);

  const [selectedReward, setSelectedReward] = useState<any | null>(null);

  const [pendingInvoice, setPendingInvoice] = useState(false);

  const [showRewardDialog, setShowRewardDialog] = useState(false);

  const [redeemReward, setRedeemReward] = useState(false);

  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);

  const [availableReward, setAvailableReward] = useState<any>(null);

  const [customerPoints, setCustomerPoints] = useState(0);

  const [processingReward, setProcessingReward] = useState(false);

  const [selectedRewardService, setSelectedRewardService] = useState<any>(null);

  const online = useNetworkStatus();

  /* =========================================================
   LOAD BRANCHES
========================================================= */

  const loadBranches = async () => {
    if (!companyId) return;

    const cacheKey = `branches-${companyId}`;

    try {
      // ===============================
      // 1. Load cached data immediately
      // ===============================

      const cachedBranches = getCache<Branch[]>(cacheKey);

      if (cachedBranches?.length) {
        setBranches(cachedBranches);

        const active = cachedBranches.find(
          (b) => String(b.id) === String(branchId),
        );

        setCurrentBranchData(active || cachedBranches[0]);
      }

      // ===============================
      // 2. Refresh from Supabase
      // ===============================

      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("carwash_id", companyId)
        .order("created_at", {
          ascending: true,
        });

      if (error) throw error;

      const branches = data ?? [];

      // ===============================
      // 3. Only update if changed
      // ===============================

      if (JSON.stringify(branches) !== JSON.stringify(cachedBranches)) {
        setCache(cacheKey, branches);

        setBranches(branches);

        const active = branches.find((b) => String(b.id) === String(branchId));

        setCurrentBranchData(active || branches[0] || null);
      } else {
      }
    } catch (err) {
      console.error("Failed loading branches", err);
    }
  };

  /* =========================================================
   LOAD VEHICLE TYPES
========================================================= */

  const loadVehicleTypes = async () => {
    const cacheKey = "vehicle-types";

    try {
      // ===============================
      // Load from cache immediately
      // ===============================

      const cachedVehicleTypes = getCache(cacheKey);

      if (cachedVehicleTypes?.length) {
        setVehicleTypes(cachedVehicleTypes);
      }

      // ===============================
      // Refresh from Supabase
      // ===============================

      const { data, error } = await supabase
        .from("vehicle_types")
        .select("*")
        .order("name");

      if (error) throw error;

      const vehicleTypes = data ?? [];

      // ===============================
      // Update cache only if changed
      // ===============================

      if (JSON.stringify(vehicleTypes) !== JSON.stringify(cachedVehicleTypes)) {
        setCache(cacheKey, vehicleTypes);

        setVehicleTypes(vehicleTypes);
      } else {
      }
    } catch (err) {
      console.error("Failed loading vehicle types:", err);
    }
  };

  /* =========================================================
   LOAD SERVICES
========================================================= */

  const loadServices = async () => {
    if (!companyId) return;

    const cacheKey = `services-${companyId}`;

    try {
      // ===============================
      // Load cached services instantly
      // ===============================

      const cachedServices = getCache(cacheKey);

      if (cachedServices?.length) {
        setServices(cachedServices);
      }

      // ===============================
      // Refresh from Supabase
      // ===============================

      const { data, error } = await supabase
        .from("services")
        .select(
          `
        *,
        service_prices (
          id,
          service_id,
          vehicle_type_id,
          price,
          vehicle_type:vehicle_types!service_prices_vehicle_type_id_fkey (
            id,
            name
          )
        )
      `,
        )
        .eq("carwash_id", companyId)
        .order("created_at", {
          ascending: true,
        });

      if (error) throw error;

      const normalized = (data ?? []).map((service: any) => ({
        ...service,

        icon: iconMap[service.icon] || Droplets,

        details: Array.isArray(service.details)
          ? service.details
          : service.description
            ? [service.description]
            : ["Professional wash service"],

        category: service.category || "GENERAL",

        time: service.duration_minutes
          ? `${service.duration_minutes} mins`
          : "15 mins",
      }));

      // ===============================
      // Update cache only if changed
      // ===============================

      if (JSON.stringify(normalized) !== JSON.stringify(cachedServices)) {
        setCache(cacheKey, normalized);

        setServices(normalized);
      } else {
      }
    } catch (err) {}
  };

  /* =========================================================
   INITIAL APPLICATION DATA
========================================================= */

  useEffect(() => {
    if (!companyId || !createdBy || !branchId) return;

    const initializeApp = async () => {
      try {
        // 1. Load static data
        await Promise.all([
          loadBranches(),
          loadVehicleTypes(),
          loadServices(),
          syncSubscriptions(companyId, branchId),
          syncRewards(branchId),
        ]);

        // 2. Cache all active subscriptions
        await syncSubscriptions(companyId, branchId);
      } catch (err) {
        console.error(err);
      }
    };

    initializeApp();
  }, [companyId, branchId, createdBy]);

  /* =========================================================
   ACTIVE BRANCH
========================================================= */

  useEffect(() => {
    if (!branches.length) return;

    const active = branches.find((b: any) => String(b.id) === String(branchId));

    setCurrentBranchData(active || branches[0] || null);
  }, [branchId, branches]);

  /* =========================================================
   SYNC OFFLINE RECORDS WHEN DATA IS BACK
========================================================= */
  useEffect(() => {
    // Run immediately if already online
    if (navigator.onLine) {
      syncManager();
    }

    // Run whenever internet comes back
    const handleOnline = () => {
      console.log("🌍 Internet restored");
      syncManager();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  /* =========================================================
   DEBUG
========================================================= */

  useEffect(() => {}, [cart]);

  useEffect(() => {}, [selectedRewardService]);

  /* =========================================================
   SEARCH VEHICLE
========================================================= */

  const searchVehicle = async () => {
    if (!plate.trim()) return;

    const cleanPlate = plate.toUpperCase().replace(/\s+/g, "");

    const cacheKey = `vehicle-${cleanPlate}`;

    try {
      setLoading(true);

      setVehicleNotFound(false);

      // =====================================
      // Try cache first
      // =====================================

      let vehicleData: any = null;

      const cachedVehicle = getCache(cacheKey);

      let baseVehicle = cachedVehicle;

      if (cachedVehicle) {
        vehicleData = cachedVehicle;

        setVehicle(vehicleData);

        if (vehicleData.vehicle_type_id) {
          setActiveVehicleType(String(vehicleData.vehicle_type_id));
        }

        setSearchType("success");
        setSearchMessage("Vehicle found successfully");
      }

      // =====================================
      // Try IndexedDB
      // =====================================

      const offlineVehicle = await offlineDB.vehicles
        .where("plate_number")
        .equals(cleanPlate)
        .first();

      if (offlineVehicle) {
        const offlineSubscription = await offlineDB.subscriptions
          .where("vehicle_id")
          .equals(offlineVehicle.id)
          .first();

        const vehicleData = {
          ...offlineVehicle,
          subscription: offlineSubscription ?? null,
        };

        setCache(cacheKey, vehicleData);

        setVehicle(vehicleData);

        setSubscription(offlineSubscription ?? null);

        if (vehicleData.vehicle_type_id) {
          setActiveVehicleType(String(vehicleData.vehicle_type_id));
        }

        // ------------------------------------
        // Rewards
        // ------------------------------------

        await checkAvailableRewards(vehicleData.customer_id);

        // ------------------------------------
        // Active subscription
        // ------------------------------------

        if (offlineSubscription) {
          const remaining = Math.max(
            Number(offlineSubscription.limit ?? 0) -
              Number(offlineSubscription.usage ?? 0),
            0,
          );
          // Build offline

          let subscriptionServices: any[] = [];

          try {
            subscriptionServices =
              typeof offlineSubscription.services === "string"
                ? JSON.parse(offlineSubscription.services)
                : Array.isArray(offlineSubscription.services)
                  ? offlineSubscription.services
                  : [];
          } catch (err) {
            console.error("Failed to parse offline subscription services", err);
          }

          const subscriptionCart = subscriptionServices
            .map((service: any, index: number) => ({
              id: `subscription-${index}`,
              name: typeof service === "string" ? service : service?.name,
              quantity: 1,
              resolvedPrice: 0,
              total: 0,
              isSubscription: true,
            }))
            .filter((item) => item.name);

          setCart(subscriptionCart);

          setCartOpen(subscriptionCart.length > 0);

          toast.success("Active subscription found", {
            description: `${offlineSubscription.plan} • ${remaining} washes remaining`,
          });

          setSearchType("success");

          setSearchMessage(
            `Subscription found (${offlineSubscription.plan}) - ${remaining} washes remaining`,
          );
        } else {
          setSearchType("success");

          setSearchMessage("Vehicle found (Offline)");
        }

        // If online, continue to refresh latest data from Supabase.
        if (!navigator.onLine) {
          return;
        }

        setSearchMessage("Vehicle found. Refreshing latest subscription...");
      }

      // =====================================
      // Supabase
      // =====================================

      const { data, error } = await supabase
        .from("vehicles")
        .select(
          `
        *,
        customers (
          id,
          name,
          phone,
          email
        )
      `,
        )
        .eq("plate_number", cleanPlate)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setVehicle(null);
        setAvailableReward(null);
        setCustomerPoints(0);
        setSubscription(null);
        setVehicleNotFound(true);

        setSearchType("info");

        setSearchMessage(
          "Vehicle not found. Register a new vehicle or continue as a walk-in customer.",
        );

        setCustomerPlate(cleanPlate);

        return;
      }

      /* =====================================
      SAVE TO MEMORY CACHE
      ===================================== */

      setCache(cacheKey, {
        ...data,
        customers: data.customers,
      });

      // =====================================
      // Subscription
      // =====================================

      const subscriptionCacheKey = `subscription-${data.id}`;

      let subscription = getCache(subscriptionCacheKey);

      // Read all cached subscriptions
      const allSubs = await offlineDB.subscriptions.toArray();

      // Try matching from cache first
      if (!subscription) {
        subscription =
          allSubs.find(
            (sub) =>
              String(sub.vehicle_id) === String(data.id) &&
              String(sub.customer_id) === String(data.customer_id) &&
              sub.status === "active",
          ) || null;

        if (subscription) {
          setCache(subscriptionCacheKey, subscription);
        }
      }

      // Not found offline → Supabase
      if (!subscription) {
        const { data: onlineSubscription, error } = await supabase
          .from("subscription_members")
          .select("*")
          .eq("vehicle_id", data.id)
          .eq("customer_id", data.customer_id)
          .eq("branch_id", branchId)
          .eq("status", "active")
          .maybeSingle();

        if (error) throw error;

        subscription = onlineSubscription;

        if (subscription) {
          await offlineDB.subscriptions.put({
            ...subscription,
            updated_at: new Date().toISOString(),
          });

          setCache(subscriptionCacheKey, subscription);
        }
      }

      vehicleData = {
        ...data,
        subscription,
      };

      /* =====================================
      SAVE TO OFFLINE DATABASE
      ===================================== */
      await offlineDB.vehicles.put({
        ...vehicleData,
        customers: data.customers,
        updated_at: new Date().toISOString(),
      });

      // =====================================
      // Save cache
      // =====================================

      setCache(cacheKey, vehicleData);

      if (vehicleData.vehicle_type_id) {
        setActiveVehicleType(String(vehicleData.vehicle_type_id));
      }

      setSubscription(subscription);

      setVehicle(vehicleData);

      await checkAvailableRewards(vehicleData.customer_id);

      setSearchType("success");

      setSearchMessage(
        subscription
          ? `Subscription found (${subscription.plan})`
          : "Vehicle found successfully",
      );

      /* ==========================
   SUBSCRIPTION SERVICES
========================== */

      if (!subscription) return;

      const renewalDate = subscription.renewal
        ? new Date(subscription.renewal)
        : null;

      const expired = renewalDate instanceof Date && renewalDate < new Date();

      const remainingWashes =
        Number(subscription.limit ?? 0) - Number(subscription.usage ?? 0);

      // ------------------------------------
      // Subscription expired
      // ------------------------------------

      if (expired) {
        setCart([]);
        setCartOpen(false);

        setSearchType("info");

        setSearchMessage(
          `Subscription expired on ${subscription.renewal}. Proceed with normal payment.`,
        );

        return;
      }

      // ------------------------------------
      // No washes remaining
      // ------------------------------------

      if (remainingWashes <= 0) {
        setCart([]);
        setCartOpen(false);

        setSearchType("info");

        setSearchMessage(
          "Subscription wash limit reached. Proceed with normal payment.",
        );

        return;
      }

      // ------------------------------------
      // Active subscription
      // ------------------------------------

      let subscriptionServices: any[] = [];

      try {
        subscriptionServices =
          typeof subscription.services === "string"
            ? JSON.parse(subscription.services)
            : Array.isArray(subscription.services)
              ? subscription.services
              : [];
      } catch (err) {
        console.error("Failed to parse subscription services", err);
      }

      const subscriptionCart = subscriptionServices
        .map((service: any, index: number) => ({
          id: `subscription-${index}`,
          name: typeof service === "string" ? service : service?.name,
          quantity: 1,
          resolvedPrice: 0,
          total: 0,
          isSubscription: true,
        }))
        .filter((item) => item.name);

      setCart(subscriptionCart);

      setCartOpen(subscriptionCart.length > 0);

      setSearchType("success");

      setSearchMessage(
        `Subscription found (${subscription.plan}) - ${remainingWashes} washes remaining`,
      );

      /* ===========================================================
      CHECK CUSTOMER REWARD ELIGIBILITY
      =========================================================== */
      async function checkAvailableRewards(customerId: string) {
        try {
          if (!customerId || !branchId) {
            setCustomerPoints(0);
            setAvailableReward(null);
            setAvailableRewards([]);
            setSelectedReward(null);
            setShowRewardDialog(false);
            return false;
          }

          const cacheKey = `rewards-${customerId}-${branchId}`;

          const cached = getCache(cacheKey);

          if (cached) {
            setCustomerPoints(cached.points);

            setAvailableReward(cached.firstReward);

            setAvailableRewards(cached.rewards);

            setSelectedReward(cached.firstReward);

            setShowRewardDialog(cached.showDialog);

            return cached.showDialog;
          }

          const offlineRewards = (
            await offlineDB.rewards
              .where("customer_id")
              .equals(customerId)
              .toArray()
          ).filter((reward) => reward.branch_id === branchId);

          if (offlineRewards.length > 0) {
            const rewards = offlineRewards
              .map((item: any) => ({
                unlock_id: item.id,
                ...(Array.isArray(item.loyalty_rewards)
                  ? item.loyalty_rewards[0]
                  : item.loyalty_rewards),
              }))
              .filter(Boolean);

            const points = offlineRewards[0]?.customer_points ?? 0;

            setCache(cacheKey, {
              points,
              rewards,
              firstReward: rewards[0] ?? null,
              showDialog: rewards.length > 0,
            });

            setCustomerPoints(points);

            setAvailableReward(rewards[0] ?? null);

            setAvailableRewards(rewards);

            setSelectedReward(rewards[0] ?? null);

            setShowRewardDialog(rewards.length > 0);

            return rewards.length > 0;
          }
          /* ------------------------------------
          CUSTOMER POINTS
          ------------------------------------ */

          const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("loyalty_points")
            .eq("id", customerId)
            .single();

          if (customerError) {
            setAvailableReward(null);
            setAvailableRewards([]);
            setSelectedReward(null);
            setShowRewardDialog(false);

            return false;
          }

          setCustomerPoints(customer?.loyalty_points ?? 0);

          /* ------------------------------------
       UNLOCKED REWARDS
    ------------------------------------ */

          const { data, error } = await supabase
            .from("loyalty_customer_rewards")
            .select(
              `
        id,
        reward_id,
        unlocked_at,
        status,
        loyalty_rewards (
          id,
          title,
          description,
          reward_type,
          reward_value,
          points_required
        )
      `,
            )
            .eq("customer_id", customerId)
            .eq("branch_id", branchId)
            .eq("status", "available")
            .order("unlocked_at", { ascending: true });

          if (error) {
            setAvailableReward(null);
            setAvailableRewards([]);
            setSelectedReward(null);
            setShowRewardDialog(false);

            return false;
          }

          if (!data || data.length === 0) {
            setCache(cacheKey, {
              points: customer?.loyalty_points ?? 0,
              rewards: [],
              firstReward: null,
              showDialog: false,
            });

            setAvailableReward(null);
            setAvailableRewards([]);
            setSelectedReward(null);
            setShowRewardDialog(false);

            return false;
          }

          /* ------------------------------------
       Flatten nested rewards
    ------------------------------------ */

          const rewards = data
            .map((item: any) => ({
              unlock_id: item.id,
              ...(Array.isArray(item.loyalty_rewards)
                ? item.loyalty_rewards[0]
                : item.loyalty_rewards),
            }))
            .filter(Boolean);

          if (rewards.length === 0) {
            setCache(cacheKey, {
              points: customer?.loyalty_points ?? 0,
              rewards: [],
              firstReward: null,
              showDialog: false,
            });

            setAvailableReward(null);
            setAvailableRewards([]);
            setSelectedReward(null);
            setShowRewardDialog(false);

            return false;
          }

          // Remove old rewards first
          await offlineDB.rewards
            .where("[customer_id+branch_id]")
            .equals([customerId, branchId])
            .delete();

          // Save fresh rewards
          await Promise.all(
            data.map((reward: any) =>
              offlineDB.rewards.put({
                ...reward,
                customer_id: customerId,
                branch_id: branchId,
                customer_points: customer?.loyalty_points ?? 0,
                updated_at: new Date().toISOString(),
              }),
            ),
          );

          /* ------------------------------------
       OPEN DIALOG
    ------------------------------------ */

          setCache(cacheKey, {
            points: customer?.loyalty_points ?? 0,

            rewards,

            firstReward: rewards[0] ?? null,

            showDialog: rewards.length > 0,
          });

          setAvailableReward(rewards[0]);
          setAvailableRewards(rewards);
          setSelectedReward(rewards[0]);

          setShowRewardDialog(true);

          return true;
        } catch (err) {
          setAvailableReward(null);
          setAvailableRewards([]);
          setSelectedReward(null);
          setShowRewardDialog(false);

          return false;
        }
      }

      /* ==========================
         NORMAL POS VEHICLE FILTER
      ========================== */

      if (data.vehicle_type_id) {
        setActiveVehicleType(String(data.vehicle_type_id));
      }
    } catch (err) {
      console.error(err);

      setSearchType("error");

      setSearchMessage("Vehicle search failed");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
   REDEEM SELECTED REWARD
========================================================== */

  const redeemSelectedReward = async () => {
    if (!selectedReward || !vehicle) return;

    try {
      setLoading(true);

      const rewardId =
        selectedReward.reward_id ??
        selectedReward.loyalty_rewards?.id ??
        selectedReward.id;

      const { data, error } = await supabase.rpc("redeem_loyalty_reward", {
        p_customer_id: vehicle.customer_id,
        p_reward_id: rewardId,
      });

      if (error) throw error;

      // ==========================================
      // Invalidate cache
      // ==========================================

      removeCache(`rewards-${vehicle.customer_id}-${branchId}`);

      removeCache(
        `vehicle-${vehicle.plate_number?.toUpperCase().replace(/\s+/g, "")}`,
      );

      // Remove offline reward cache
      await offlineDB.rewards
        .where("[customer_id+branch_id]")
        .equals([vehicle.customer_id, branchId])
        .delete();

      // Remove offline vehicle cache
      await offlineDB.vehicles.delete(vehicle.id);

      // ==========================================
      // Update UI
      // ==========================================

      setRedeemReward(true);

      setSelectedReward({
        ...selectedReward,
        redeemed: true,
      });

      if (data?.points_remaining !== undefined) {
        setCustomerPoints(data.points_remaining);
      }

      setShowRewardDialog(false);

      toast.success(
        data?.reward
          ? `${data.reward} redeemed successfully.`
          : "Reward redeemed successfully.",
      );
    } catch (err: any) {
      console.error(err);

      toast.error(err?.message || "Unable to redeem reward.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SAVE VEHICLE
  ========================================================= */

  const saveVehicle = async () => {
    try {
      if (!canOperate) {
        alert("Invalid branch session");
        return;
      }

      setSavingVehicle(true);

      const cleanPlate = newVehiclePlate.toUpperCase().replace(/\s+/g, "");

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          carwash_id: companyId,
          branch_id: branchId,
          name: newCustomerName,
          phone: newCustomerPhone,
        })
        .select()
        .single();

      if (customerError) {
        alert(customerError.message);
        return;
      }

      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          carwash_id: companyId,
          branch_id: branchId,
          customer_id: customerData.id,
          plate_number: cleanPlate,
          type: newVehicleType,
          color: newVehicleColor,
        })
        .select()
        .single();

      if (vehicleError) {
        alert(vehicleError.message);
        return;
      }

      setVehicle(vehicleData);

      setPlate(vehicleData.plate_number);

      setSearchType("success");

      setSearchMessage("Vehicle added successfully");

      setShowAddVehicleCard(false);

      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewVehiclePlate("");
      setNewVehicleType("");
      setNewVehicleColor("");
    } catch (err) {
      alert("Failed to save vehicle");
    } finally {
      setSavingVehicle(false);
    }
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const addToCart = (service: any) => {
    const resolvedPrice = Number(service.displayPrice || 0);

    if (resolvedPrice <= 0) {
      alert("This service has no pricing configured");
      return;
    }

    const existingIndex = cart.findIndex(
      (item) =>
        item.id === service.id &&
        item.displayVehicleTypeId === service.displayVehicleTypeId,
    );

    if (existingIndex >= 0) {
      const updated = [...cart];

      updated[existingIndex].quantity += 1;

      updated[existingIndex].total =
        updated[existingIndex].quantity * updated[existingIndex].resolvedPrice;
      console.trace("setCart");
      setCart(updated);

      return;
    }
    console.trace("setCart");
    setCart((prev) => [
      ...prev,
      {
        ...service,
        quantity: 1,
        resolvedPrice,
        total: resolvedPrice,
      },
    ]);
  };

  /* =========================================================
     REMOVE FROM CART
  ========================================================= */

  const removeFromCart = (index: number) => {
    console.trace("setCart");
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  /* =========================================================
     UPDATE QUANTITY
  ========================================================= */

  const updateQuantity = (index: number, type: "increase" | "decrease") => {
    const updated = [...cart];

    if (type === "increase") {
      updated[index].quantity += 1;
    } else {
      updated[index].quantity -= 1;

      if (updated[index].quantity <= 0) {
        removeFromCart(index);
        return;
      }
    }

    updated[index].total =
      updated[index].quantity * updated[index].resolvedPrice;
    console.trace("setCart");
    setCart(updated);
  };

  /* =========================================================
   COMPLETE PAYMENT
========================================================= */

  const completePayment = async () => {
    if (!invoiceId) {
      toast.warning("Generate an invoice first", {
        description: "Create an invoice before processing payment.",
      });
      return;
    }

    try {
      setProcessingPayment(true);

      const { error } = await supabase
        .from("invoices")
        .update({
          payment_status: "PAID",
          status: "COMPLETED",
        })
        .eq("id", invoiceId);

      if (error) throw error;

      // Invalidate cached invoice(s)
      removeCache(`invoice-${invoiceId}`);
      removeCache("invoice-list");

      toast.success("Payment completed successfully", {
        description: "The invoice has been marked as paid.",
      });

      router.push("/invoices");
    } catch (err: any) {
      console.error(err);

      toast.error("Failed to complete payment", {
        description: err.message,
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  /* =========================================================
     FILTER SERVICES
  ========================================================= */

  const filteredServices = useMemo(() => {
    let result: any[] = [];

    services.forEach((service) => {
      const matchesSearch = service.name
        ?.toLowerCase()
        .includes(serviceSearch.toLowerCase());

      if (!matchesSearch) return;

      service.service_prices?.forEach((priceItem: any) => {
        // FILTER BY VEHICLE TYPE
        if (
          activeVehicleType &&
          String(priceItem.vehicle_type_id) !== String(activeVehicleType)
        ) {
          return;
        }

        result.push({
          ...service,

          displayVehicle: priceItem.vehicle_type?.name || "Vehicle",

          displayPrice: Number(priceItem.price || 0),

          displayVehicleTypeId: priceItem.vehicle_type_id,
        });
      });
    });

    return result;
  }, [services, serviceSearch, activeVehicleType]);

  const rewardServices = availableRewards.map((reward) => {
    return {
      id: reward.id,
      name: reward.title,
      description: reward.description,
      displayPrice: 0,
      resolvedPrice: 0,
      quantity: 1,
      isReward: true,
      reward_id: reward.id,
      reward_type: reward.reward_type,
    };
  });
  /* =========================================================
    SAVE CUSTOMER FROM POS
========================================================= */

  const saveCustomerFromPOS = async () => {
    try {
      const cleanPlate = customerPlate.toUpperCase().replace(/\s+/g, "");

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          carwash_id: companyId,
          branch_id: branchId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          tag: customerTag,
        })
        .select()
        .single();

      if (customerError) {
        alert(customerError.message);
        return;
      }

      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          customer_id: customerData.id,
          carwash_id: companyId,
          branch_id: branchId,
          plate_number: cleanPlate,
          type: customerVehicleType,
          color: customerColor,
        })
        .select(
          `
        *,
        customers (
          id,
          name,
          phone,
          email
        )
      `,
        )
        .single();

      if (vehicleError) {
        alert(vehicleError.message);
        return;
      }

      setVehicle(vehicleData);

      setPlate(vehicleData.plate_number);

      setSearchType("success");

      setSearchMessage("Customer & vehicle registered successfully");

      setShowCustomerModal(false);

      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerPlate("");
      setCustomerVehicleType("");
      setCustomerColor("");
    } catch (err) {
      alert("Failed to save customer");
    }
  };
  /* =========================================================
     TOTALS
  ========================================================= */

  const subtotal = cart.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const taxAmount = subtotal * (Number(taxPercent || 0) / 100);

  const grandTotal = subtotal + taxAmount - Number(discount || 0);

  /* =========================================================
     ACTIVE VEHICLE
  ========================================================= */
  const isExpired = subscription?.renewal
    ? new Date(subscription.renewal) < new Date()
    : false;

  const remainingWashes = subscription
    ? subscription.limit - subscription.usage
    : 0;

  const hasSubscriptionWash =
    !!subscription && !isExpired && remainingWashes > 0;

  const activeVehicle = vehicleTypes.find(
    (v) => String(v.id) === String(activeVehicleType),
  );

  /* =========================================================
     COMPLETE PAYMENT
  ========================================================= */

  async function generateInvoice(redeem = false, invoiceCart = cart) {
    if (availableRewards.length > 0 && !selectedReward) {
      setPendingInvoice(true);
      setShowRewardDialog(true);
      return;
    }
    if (!canOperate) {
      toast.error("Branch access invalid");
      return;
    }

    if (invoiceCart.length === 0) {
      toast.warning("Add at least one service before generating an invoice.");
      return;
    }

    try {
      setProcessingPayment(true);

      /* =========================================================
      LOCAL INVOICE ID
      ========================================================= */

      const localInvoiceId = crypto.randomUUID();

      const invoiceNumber = "INV-" + Date.now();

      const servicesArray = invoiceCart.map((item) => ({
        service_id: item.rewardApplied ? null : item.id,

        reward_id: item.rewardApplied ? item.rewardId : null,

        reward: item.rewardApplied,

        reward_type: item.rewardType ?? null,

        name: item.name,

        price: item.resolvedPrice,

        quantity: item.quantity,

        total: item.total,
      }));
      /* =========================================================
         SUBSCRIPTION STATUS
      ========================================================= */

      const remainingWashes = subscription
        ? Math.max(
            Number(subscription.limit ?? 0) - Number(subscription.usage ?? 0),
            0,
          )
        : 0;

      const isSubscribed = remainingWashes > 0;

      const subscriptionAvailable = subscription && remainingWashes > 0;

      const isReward = redeem;

      const finalTotal = isSubscribed || isReward ? 0 : grandTotal;

      const payload = {
        id: localInvoiceId,

        invoice_number: invoiceNumber,

        carwash_id: companyId,

        branch_id: branchId,

        created_by: createdBy,

        vehicle_id: vehicle?.id || null,

        customer_id: vehicle?.customer_id || null,

        plate: vehicle?.plate_number || plate.toUpperCase(),

        customer: vehicle?.customers?.name || "Walk-in Customer",

        services: servicesArray,

        subtotal,

        tax: taxAmount,

        discount,

        total: finalTotal,

        payment_method: isSubscribed
          ? "SUBSCRIPTION"
          : isReward
            ? "LOYALTY_REWARD"
            : paymentMethod,

        payment_status: isSubscribed || isReward ? "PAID" : "UNPAID",

        status: isSubscribed || isReward ? "COMPLETED" : "PENDING",

        notes: isReward ? `FREE REWARD - ${selectedReward?.title}` : notes,

        cashier: profile?.full_name || "Staff",
      };

      /* =========================================================
   CREATE INVOICE
========================================================= */

      let invoice = payload;

      if (!isOnline()) {
        await offlineDB.invoices.put({
          id: localInvoiceId,

          status: "pending",

          payload,

          created_at: new Date().toISOString(),
        });

        console.log("Offline invoices:", await offlineDB.invoices.toArray());

        console.log(
          "Pending transactions:",
          await offlineDB.pendingTransactions.toArray(),
        );

        console.log("➡️ About to queue invoice");
        await queueTransaction("invoice", payload);
        console.log("✅ queueTransaction finished");
      } else {
        const { data, error } = await supabase
          .from("invoices")
          .insert([payload])
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        invoice = data;
      }

      // =========================================================
      // REDEEM REWARD
      // =========================================================

      if (redeem && selectedReward && vehicle?.customer_id) {
        const rewardId = selectedReward.reward_id ?? selectedReward.id;

        const rewardPayload = {
          customer_id: vehicle.customer_id,
          reward_id: rewardId,
          branch_id: branchId,
          carwash_id: companyId,
          redeemed_at: new Date().toISOString(),
        };

        if (isOnline()) {
          const { error: redeemError } = await supabase.rpc(
            "redeem_loyalty_reward",
            {
              p_customer_id: vehicle.customer_id,
              p_reward_id: rewardId,
            },
          );

          if (redeemError) {
            toast.error(redeemError.message);
            return;
          }
        } else {
          await queueTransaction("reward", rewardPayload);

          removeCache(`rewards-${vehicle.customer_id}-${branchId}`);

          toast.success("Reward queued", {
            description: "Reward redemption will sync automatically.",
          });
        }
      }

      //autodeduct wash
      /* =========================================================
   AUTO DEDUCT SUBSCRIPTION WASH
========================================================= */

      if (isSubscribed && subscription) {
        const subscriptionPayload = {
          subscription_id: subscription.id,
          vehicle_id: vehicle?.id,
          customer_id: vehicle?.customer_id,
          usage: subscription.usage + 1,
          updated_at: new Date().toISOString(),
        };

        if (isOnline()) {
          const { error } = await supabase
            .from("subscription_members")
            .update({
              usage: subscription.usage + 1,
            })
            .eq("id", subscription.id);

          if (error) throw error;
        } else {
          await queueTransaction("subscription", subscriptionPayload);

          removeCache(`subscription-${vehicle?.id}`);

          toast.success("Subscription queued", {
            description: "Wash usage will sync automatically.",
          });
        }
      }

      if (isSubscribed || isReward) {
        setSubscription(null);

        setVehicle(null);

        setPlate("");
        setCart([]);

        setCartOpen(false);

        setActiveVehicleType("");

        setSearchMessage(
          isReward
            ? "Reward redeemed successfully."
            : "Subscription wash completed successfully.",
        );

        setSearchType("success");
      }

      /* =========================
   AUTO SEND TO QUEUE
========================= */

      const ticket = "Q-" + Date.now().toString().slice(-6);

      const serviceNames = invoiceCart.map((item) => item.name).join(", ");

      const queuePayload = {
        ticket,

        plate: vehicle?.plate_number || plate.toUpperCase(),

        customer: vehicle?.customers?.name || "Walk-in Customer",

        vehicle: activeVehicle?.name || "Vehicle",

        service: serviceNames,

        bay: "Unassigned",

        staff: "Unassigned",

        assigned_staff: null,

        eta: "Pending",

        check_in: new Date().toLocaleTimeString(),

        priority: "Normal",

        payment: isSubscribed || isReward ? "Paid" : "Pending",

        status: "waiting",

        invoice_id: invoice.id,

        branch_id: branchId,

        carwash_id: companyId,
      };

      /* =========================================================
   AUTO SEND TO QUEUE
========================================================= */

      if (isOnline()) {
        const { error: queueError } = await supabase
          .from("queue_vehicles")
          .insert(queuePayload);

        if (queueError) throw queueError;
      } else {
        // Save locally so staff can still see today's queue
        await offlineDB.queue.put({
          id: queuePayload.ticket,
          status: "pending",
          payload: queuePayload,
          created_at: new Date().toISOString(),
        });

        // Queue for background sync
        await queueTransaction("queue", queuePayload);

        // Clear cached queue
        removeCache("queue-list");

        toast.success("Vehicle added to queue", {
          description: "Queue will sync automatically when internet returns.",
        });
      }

      /* =========================================================
   CLEAR STALE CACHE
========================================================= */

      removeCache("invoice-list");

      removeCache("queue-list");

      removeCache("dashboard");

      removeCache("dashboard-kpis");

      if (vehicle?.customer_id) {
        removeCache(`customer-${vehicle.customer_id}`);

        removeCache(`rewards-${vehicle.customer_id}-${branchId}`);
      }

      if (vehicle?.id) {
        removeCache(`subscription-${vehicle.id}`);
      }

      if (vehicle?.plate_number) {
        removeCache(
          `vehicle-${vehicle.plate_number.toUpperCase().replace(/\s+/g, "")}`,
        );
      }

      setInvoiceId(invoice.id);

      setCart([]);

      setNotes("");

      setDiscount(0);

      toast.success("Payment Successful", {
        description:
          "Receipt generated successfully. Vehicle added to the queue.",
      });
    } catch (err: any) {
      console.error(err);

      toast.error("Failed to process payment", {
        description: err?.message,
      });
    } finally {
      setProcessingPayment(false);
    }
  }

  /* =========================================================
     PRINT
  ========================================================= */

  const openInvoices = () => {
    router.push("/invoices");
  };

  /* =========================================================
   VEHICLE FILTER BADGES
========================================================= */

  const vehicleCategories = [
    {
      id: "",
      name: "ALL",
    },

    ...vehicleTypes.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
    })),
  ];

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <div className="min-h-screen bg-[#020817] text-white">
        {/* HEADER */}

        <div className="relative overflow-hidden rounded-[28px] border border-cyan-500/10 bg-gradient-to-br from-[#071428] via-[#09172D] to-[#06111F] shadow-[0_20px_60px_rgba(0,0,0,.35)]">
          {/* Glow */}

          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 -left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left */}

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <Car className="h-7 w-7 text-cyan-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase">
                      POS Terminal
                    </span>
                  </div>

                  <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    WashPro Terminal
                  </h1>

                  <p className="mt-1 text-sm text-slate-400">
                    Smart billing, check-ins & payments.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}

              <div className="absolute top-4 right-4 hidden xl:flex xl:flex-col xl:items-end xl:gap-3">
                {/* CONNECTION STATUS */}

                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase backdrop-blur-xl ${
                    online
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      online
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.8)]"
                        : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,.8)]"
                    }`}
                  />

                  {online ? "ONLINE MODE" : "OFFLINE MODE"}
                </div>

                {/* STATS */}

                <div className="grid grid-cols-3 gap-2">
                  {/* Branch */}
                  <div className="rounded-2xl border border-orange-500/15 bg-orange-500/10 p-3 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-400" />

                      <span className="text-[9px] font-bold tracking-[0.2em] text-orange-300 uppercase">
                        Branch
                      </span>
                    </div>

                    <p className="mt-2 max-w-[110px] truncate text-xs font-bold text-white">
                      {currentBranchData?.name || "Main Branch"}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-400" />

                      <span className="text-[9px] font-bold tracking-[0.2em] text-emerald-300 uppercase">
                        Location
                      </span>
                    </div>

                    <p className="mt-2 max-w-[110px] truncate text-xs font-bold text-white">
                      {currentBranchData?.location || "Not Set"}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/10 p-3 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-400" />

                      <span className="text-[9px] font-bold tracking-[0.2em] text-cyan-300 uppercase">
                        Role
                      </span>
                    </div>

                    <p className="mt-2 truncate text-xs font-bold text-white capitalize">
                      {profile?.role || "Staff"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* MAIN */}

          <div
            className={`grid gap-6 transition-all duration-300 ${
              cartOpen && cart.length > 0
                ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]"
                : "grid-cols-1"
            }`}
          >
            {/* LEFT */}

            <div>
              {/* VEHICLE SEARCH */}

              <div className="mt-4 overflow-hidden rounded-[28px] border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] shadow-lg shadow-cyan-500/5">
                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
                      <Search className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-white sm:text-lg">
                        Vehicle Search
                      </h2>

                      <p className="text-xs text-slate-400 sm:text-sm">
                        Search using the vehicle registration number.
                      </p>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        placeholder="KDA123A"
                        className="h-12 w-full rounded-2xl border border-slate-700 bg-slate-950/60 pr-4 pl-11 text-sm text-white transition-all outline-none placeholder:text-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                      />
                    </div>

                    <button
                      onClick={searchVehicle}
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:opacity-60 lg:w-auto"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Search
                        </>
                      )}
                    </button>
                  </div>

                  {/* Search Result */}
                  {searchMessage && (
                    <div
                      className={`mt-4 rounded-2xl border p-4 transition-all ${
                        searchType === "success"
                          ? "border-emerald-500/20 bg-emerald-500/10"
                          : searchType === "error"
                            ? "border-red-500/20 bg-red-500/10"
                            : "border-amber-500/20 bg-amber-500/10"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left */}
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              searchType === "success"
                                ? "bg-emerald-500/15"
                                : searchType === "error"
                                  ? "bg-red-500/15"
                                  : "bg-amber-500/15"
                            }`}
                          >
                            {searchType === "success" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : searchType === "error" ? (
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                            ) : (
                              <Clock3 className="h-5 w-5 text-amber-400" />
                            )}
                          </div>

                          <div>
                            <h3
                              className={`text-sm font-bold ${
                                searchType === "success"
                                  ? "text-emerald-300"
                                  : searchType === "error"
                                    ? "text-red-300"
                                    : "text-amber-300"
                              }`}
                            >
                              {searchType === "success"
                                ? "Vehicle Found"
                                : searchType === "error"
                                  ? "Vehicle Not Found"
                                  : "Notice"}
                            </h3>

                            <p className="mt-1 text-sm leading-5 text-slate-300">
                              {searchMessage}
                            </p>
                          </div>
                        </div>

                        {/* Action */}
                        {vehicleNotFound && (
                          <button
                            onClick={() => {
                              setCustomerPlate(plate);
                              setShowCustomerModal(true);
                            }}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 sm:w-auto"
                          >
                            <Plus className="h-4 w-4" />
                            Register Vehicle
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FILTER BAR */}

              <div className="mt-6 overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#081A33] via-[#0B1220] to-[#020817] shadow-xl">
                <div className="p-4 sm:p-5 lg:p-6">
                  <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto]">
                    <div className="relative">
                      <Search className="absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services..."
                        className="h-14 w-full rounded-2xl border border-slate-700 bg-slate-950/60 pr-4 pl-14 text-white transition-all duration-300 outline-none placeholder:text-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                      />
                    </div>

                    <div className="relative">
                      <Car className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <select
                        value={activeVehicleType}
                        onChange={(e) => setActiveVehicleType(e.target.value)}
                        className="h-14 w-full appearance-none rounded-2xl border border-slate-700 bg-slate-950/60 pr-10 pl-14 text-white transition-all duration-300 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                      >
                        <option value="">All Vehicles</option>

                        {vehicleTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    </div>

                    <button
                      onClick={openInvoices}
                      className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-emerald-500/40 active:scale-[0.98] lg:w-auto"
                    >
                      <CheckCircle2 className="h-5 w-5" />

                      <span>Complete Payment</span>
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {filteredServices.length} Services
                    </span>

                    {activeVehicleType && (
                      <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
                        Vehicle Filter Active
                      </span>
                    )}

                    {serviceSearch && (
                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                        Searching: "{serviceSearch}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`mt-6 grid gap-4 transition-all duration-300 ${
                  cartOpen && cart.length > 0
                    ? "grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
                    : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                }`}
              >
                {filteredServices.map((item, i) => {
                  const Icon =
                    typeof item.icon === "function" ? item.icon : Droplets;

                  return (
                    <div
                      key={i}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F172A] via-[#0B1628] to-[#081120] shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-cyan-500/10"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 ring-1 ring-cyan-500/20 transition group-hover:scale-105">
                            <Icon className="h-7 w-7 text-cyan-400" />
                          </div>

                          <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-yellow-300 uppercase">
                            {item.displayVehicle}
                          </span>
                        </div>

                        <div className="mt-4">
                          <h3 className="line-clamp-1 text-lg font-black text-white">
                            {item.name}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-[38px] text-xs leading-5 text-slate-400">
                            {item.details?.[0] ||
                              "Professional vehicle cleaning service."}
                          </p>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] tracking-widest text-slate-500 uppercase">
                                Price
                              </p>

                              <h2 className="mt-1 text-xl font-black text-cyan-400">
                                KSh{" "}
                                {Number(
                                  item.displayPrice || 0,
                                ).toLocaleString()}
                              </h2>
                            </div>

                            <div className="rounded-xl bg-slate-900 px-3 py-2 text-center">
                              <p className="text-[9px] tracking-wider text-slate-500 uppercase">
                                Time
                              </p>

                              <p className="mt-1 text-xs font-bold text-white">
                                {item.time}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={hasSubscriptionWash}
                          onClick={() => {
                            if (hasSubscriptionWash) return;
                            addToCart(item);
                          }}
                          className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all duration-300 ${
                            hasSubscriptionWash
                              ? "cursor-not-allowed bg-slate-800 text-slate-500"
                              : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95"
                          }`}
                        >
                          <ShoppingCart className="h-4 w-4" />

                          {hasSubscriptionWash ? "Unavailable" : "Add Service"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT CHECKOUT */}

            {cart.length > 0 && cartOpen && (
              <div
                className={`sticky top-4 h-fit shrink-0 overflow-hidden transition-all duration-300 ${
                  cartOpen ? "w-full max-w-[420px]" : "w-[72px]"
                }`}
              >
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#07111F]">
                  <div className="border-b border-white/10 bg-gradient-to-r from-[#081A33] via-[#0B1220] to-[#07111F] p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 sm:h-14 sm:w-14">
                          <ShoppingCart className="h-6 w-6 text-cyan-400 sm:h-7 sm:w-7" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold tracking-[0.25em] text-cyan-400 uppercase sm:text-xs">
                            Checkout
                          </p>

                          <h2 className="truncate text-xl font-black text-white sm:text-3xl">
                            POS Cart
                          </h2>

                          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                            {cart.length}{" "}
                            {cart.length === 1 ? "service" : "services"}{" "}
                            selected
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setCartOpen(!cartOpen)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20"
                      >
                        {cartOpen ? (
                          <PanelRightClose className="h-5 w-5" />
                        ) : (
                          <PanelRightOpen className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-white/10 p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                        <User className="h-7 w-7 text-cyan-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                          Customer
                        </p>

                        <h3 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">
                          {vehicle?.customers?.name || "Walk-in Customer"}
                        </h3>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3">
                            <p className="text-[10px] tracking-widest text-green-300 uppercase">
                              Plate
                            </p>

                            <p className="mt-1 truncate font-bold text-white">
                              {vehicle?.plate_number || plate || "NO PLATE"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                            <p className="text-[10px] tracking-widest text-cyan-300 uppercase">
                              Status
                            </p>

                            <p className="mt-1 font-bold text-white">
                              {subscription
                                ? isExpired
                                  ? "Expired"
                                  : hasSubscriptionWash
                                    ? "Subscribed"
                                    : "Limit Reached"
                                : "Standard"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {hasSubscriptionWash && (
                      <div className="mt-5 rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />

                          <div>
                            <p className="font-bold text-green-300">
                              Subscription Wash Available
                            </p>

                            <p className="mt-1 text-sm text-green-200">
                              This wash will be covered by the customer's
                              subscription.
                            </p>

                            <p className="mt-1 text-sm text-green-200">
                              One remaining wash will be deducted automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {subscription && (
                      <>
                        {isExpired ? (
                          <div className="mt-4 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-rose-500/10 p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                              <div>
                                <p className="font-bold text-red-300">
                                  Subscription Expired
                                </p>

                                <p className="mt-1 text-sm text-red-200">
                                  Renewal date has passed.
                                </p>

                                <p className="text-sm text-red-200">
                                  Customer will proceed with normal payment.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : hasSubscriptionWash ? (
                          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10 p-4">
                            <div className="flex items-start gap-3">
                              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                              <div className="flex-1">
                                <p className="font-bold text-emerald-300">
                                  Active Subscription
                                </p>

                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-[10px] tracking-widest text-emerald-200 uppercase">
                                      Remaining
                                    </p>

                                    <p className="font-bold text-white">
                                      {remainingWashes} Washes
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] tracking-widest text-emerald-200 uppercase">
                                      Plan
                                    </p>

                                    <p className="truncate font-bold text-white">
                                      {subscription.plan}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4">
                            <div className="flex items-start gap-3">
                              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />

                              <div>
                                <p className="font-bold text-orange-300">
                                  Wash Limit Reached
                                </p>

                                <p className="mt-1 text-sm text-orange-200">
                                  All subscription washes have been used.
                                </p>

                                <p className="text-sm text-orange-200">
                                  Customer will continue with standard payment.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* CART */}

                  <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-6">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10">
                          <ShoppingCart className="h-10 w-10 text-cyan-400" />
                        </div>

                        <h3 className="mt-6 text-xl font-black text-white">
                          Your Cart is Empty
                        </h3>

                        <p className="mt-2 max-w-xs text-center text-sm text-slate-400">
                          Search and add wash services to begin checkout.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item, index) => (
                          <div
                            key={index}
                            className="group rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F172A] via-[#0B1220] to-[#081120] p-4 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                                    <Droplets className="h-5 w-5 text-cyan-400" />
                                  </div>

                                  <div className="min-w-0">
                                    <h3 className="truncate text-base font-bold text-white">
                                      {item.name}
                                    </h3>

                                    <p className="truncate text-xs text-slate-400">
                                      {item.displayVehicle}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => removeFromCart(index)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] tracking-widest text-slate-500 uppercase">
                                    Unit Price
                                  </p>

                                  <p className="mt-1 font-semibold text-slate-300">
                                    KSh{" "}
                                    {Number(
                                      item.resolvedPrice,
                                    ).toLocaleString()}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] tracking-widest text-slate-500 uppercase">
                                    Total
                                  </p>

                                  <h3 className="mt-1 text-xl font-black text-cyan-400">
                                    KSh{" "}
                                    {Number(item.total || 0).toLocaleString()}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1">
                                <button
                                  onClick={() =>
                                    updateQuantity(index, "decrease")
                                  }
                                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>

                                <div className="min-w-[44px] text-center text-lg font-black text-white">
                                  {item.quantity}
                                </div>

                                <button
                                  onClick={() =>
                                    updateQuantity(index, "increase")
                                  }
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition hover:bg-cyan-500 hover:text-white"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                Qty {item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TOTALS */}

                  <div className="border-t border-white/10 bg-gradient-to-b from-[#0B1220] to-[#08111E] p-4 sm:p-6">
                    <div className="rounded-3xl border border-cyan-500/15 bg-cyan-500/5 p-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Subtotal</span>

                          <span className="font-semibold text-white">
                            KSh {subtotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Tax</span>

                          <span className="font-semibold text-white">
                            KSh {taxAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Discount</span>

                          <span className="font-semibold text-red-400">
                            - KSh {discount.toLocaleString()}
                          </span>
                        </div>

                        <div className="my-2 border-t border-white/10" />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs tracking-[0.2em] text-cyan-400 uppercase">
                              Total Payable
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Inclusive of taxes & discounts
                            </p>
                          </div>

                          <div className="text-right">
                            <h2 className="text-3xl font-black text-cyan-400 sm:text-4xl">
                              KSh{" "}
                              {hasSubscriptionWash
                                ? "0"
                                : grandTotal.toLocaleString()}
                            </h2>

                            {hasSubscriptionWash && (
                              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Subscription Wash
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!(
                      subscription && subscription.limit - subscription.usage
                    ) && (
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {/* Cash / Card / Mpesa Buttons */}
                      </div>
                    )}

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => generateInvoice()}
                        disabled={processingPayment}
                        className={`group flex h-14 items-center justify-center gap-3 rounded-2xl font-bold transition-all duration-300 ${
                          processingPayment
                            ? "cursor-not-allowed bg-slate-700 text-slate-300 opacity-70"
                            : "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30 hover:-translate-y-0.5 hover:shadow-cyan-500/50"
                        } `}
                      >
                        {processingPayment ? (
                          <>
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Receipt className="h-5 w-5 transition group-hover:rotate-6" />
                            Generate Receipt
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setCart([])}
                        className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 font-bold text-red-300 transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-5 w-5" />
                        Clear Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD VEHICLE MODAL */}

      {showAddVehicleCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0B1220] p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                  Vehicle Registration
                </p>

                <h2 className="text-3xl font-black text-white">
                  Add New Vehicle
                </h2>
              </div>

              <button
                onClick={() => setShowAddVehicleCard(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white"
              />

              <input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone Number"
                className="h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white"
              />

              <input
                value={newVehiclePlate}
                onChange={(e) =>
                  setNewVehiclePlate(e.target.value.toUpperCase())
                }
                placeholder="Plate Number"
                className="h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white uppercase"
              />

              <input
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
                placeholder="Vehicle Type"
                className="h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white"
              />

              <input
                value={newVehicleColor}
                onChange={(e) => setNewVehicleColor(e.target.value)}
                placeholder="Vehicle Color"
                className="h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white md:col-span-2"
              />
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={saveVehicle}
                disabled={savingVehicle}
                className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-sm font-bold text-white"
              >
                {savingVehicle ? "Saving Vehicle..." : "Save Vehicle"}
              </button>

              <button
                onClick={() => setShowAddVehicleCard(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="fixed top-6 right-6 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-600"
              >
                <ShoppingCart className="h-6 w-6 text-white" />

                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
    CUSTOMER REWARD REDEMPTION
========================================================== */}

      {showRewardDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#081A33] shadow-2xl">
            {/* ================= HEADER ================= */}

            <div className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15">
                  <Gift className="h-6 w-6 text-cyan-300" />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    Reward Available
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Redeem a loyalty reward before completing payment.
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-cyan-300">
                    <Coins className="h-3.5 w-3.5" />
                    <span className="text-[10px] uppercase">Points</span>
                  </div>

                  <p className="mt-1 text-xl font-black text-cyan-300">
                    {customerPoints}
                  </p>
                </div>
              </div>
            </div>

            {/* ================= REWARDS ================= */}

            <div className="max-h-[45vh] space-y-3 overflow-y-auto p-4">
              {availableRewards.map((reward) => {
                const selected = selectedReward?.id === reward.id;

                return (
                  <button
                    key={reward.id}
                    onClick={() => {
                      setSelectedReward(reward);

                      setSelectedRewardService({
                        id: reward.id,
                        name: reward.title,
                        quantity: 1,
                        resolvedPrice: 0,
                        total: 0,
                        rewardApplied: true,
                        rewardType: reward.reward_type,
                        rewardId: reward.id,
                      });
                    }}
                    className={`w-full rounded-2xl border text-left transition ${
                      selected
                        ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-400/30"
                        : "border-slate-700 bg-[#0B1220] hover:border-cyan-400"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-cyan-500 text-white"
                            : "bg-slate-800 text-cyan-300"
                        }`}
                      >
                        <Sparkles className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-white">
                            {reward.title}
                          </h3>

                          {selected && (
                            <BadgeCheck className="h-4 w-4 shrink-0 text-green-400" />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                          {reward.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                            <TicketPercent className="h-3.5 w-3.5" />
                            {reward.reward_type}
                          </span>

                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                            {reward.reward_value}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] tracking-wide text-cyan-300 uppercase">
                          Cost
                        </p>

                        <p className="text-lg font-bold text-cyan-300">
                          {reward.points_required}
                        </p>

                        <p className="text-xs text-slate-400">pts</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ================= FOOTER ================= */}

            <div className="border-t border-slate-800 bg-[#07142B] p-4">
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />

                <p className="text-xs text-yellow-100">
                  Redeeming a reward immediately deducts the required loyalty
                  points.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRedeemReward(true);
                    setShowRewardDialog(false);

                    if (pendingInvoice) {
                      setPendingInvoice(false);
                      generateInvoice();
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-700 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Skip
                </button>

                <button
                  disabled={!selectedReward}
                  onClick={async () => {
                    setShowRewardDialog(false);

                    if (!selectedRewardService) {
                      toast.warning("Select a service", {
                        description:
                          "Choose at least one wash service before continuing.",
                      });
                      return;
                    }

                    const rewardCart = [
                      {
                        ...selectedRewardService,
                        quantity: 1,
                        resolvedPrice: 0,
                        total: 0,
                        rewardApplied: true,
                      },
                    ];

                    await generateInvoice(true, rewardCart);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Gift className="h-4 w-4" />
                  Redeem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomerModal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        editingCustomer={null}
        name={customerName}
        setName={setCustomerName}
        phone={customerPhone}
        setPhone={setCustomerPhone}
        email={customerEmail}
        setEmail={setCustomerEmail}
        tag={customerTag as "regular" | "vip" | "corporate" | "new"}
        setTag={setCustomerTag}
        plate={customerPlate}
        setPlate={setCustomerPlate}
        vehicleType={customerVehicleType}
        setVehicleType={setCustomerVehicleType}
        color={customerColor}
        setColor={setCustomerColor}
        loading={savingVehicle}
        message=""
        messageType=""
        onSubmit={saveCustomerFromPOS}
      />

      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(!cartOpen)}
          className="fixed right-6 bottom-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500 shadow-xl transition hover:scale-105"
        >
          <ShoppingCart className="h-7 w-7 text-white" />

          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {cart.length}
          </span>
        </button>
      )}
    </>
  );
}
