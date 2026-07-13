"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import CustomerModal from "@/components/customers/CustomerModal";
import { useRouter } from "next/navigation";

import {
  Droplets,
  Sparkles,
  Gem,
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
  Activity,
  ShieldCheck,
  ShoppingCart,
  Gift,
  Star,
  Coins,
  BadgeCheck,
  TicketPercent,
  ChevronRight,
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

  /* =========================================================
     CORE STATES
  ========================================================= */

  const [loading, setLoading] = useState(false);

  const [savingVehicle, setSavingVehicle] = useState(false);

  const [processingPayment, setProcessingPayment] = useState(false);

  const [invoiceId, setInvoiceId] = useState<number | null>(null);

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

  /* =========================================================
     LOAD BRANCHES
  ========================================================= */

  const loadBranches = async () => {
    try {
      if (!companyId) return;

      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("carwash_id", companyId)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        return;
      }

      setBranches(data || []);

      const active = data?.find((b: any) => String(b.id) === String(branchId));

      setCurrentBranchData(active || data?.[0] || null);
    } catch (err) {}
  };

  /* =========================================================
     LOAD VEHICLE TYPES
  ========================================================= */

  const loadVehicleTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_types")
        .select("*")
        .order("name");

      if (error) {
        return;
      }

      setVehicleTypes(data || []);
    } catch (err) {}
  };

  /* =========================================================
     LOAD SERVICES
  ========================================================= */

  const loadServices = async () => {
    try {
      if (!companyId || !branchId) return;

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

      if (error) {
        return;
      }

      const normalized = (data || []).map((service: any) => ({
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

      setServices(normalized);
    } catch (err) {}
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (!branchId || !createdBy) return;

    loadBranches();
    loadVehicleTypes();
    loadServices();
  }, [branchId, createdBy]);

  useEffect(() => {}, [cart, cartOpen]);

  useEffect(() => {
    console.log("Cart changed:", cart);
  }, [cart]);

  useEffect(() => {
    console.log("selectedRewardService =", selectedRewardService);
  }, [selectedRewardService]);
  /* =========================================================
     SEARCH VEHICLE
  ========================================================= */

  const searchVehicle = async () => {
    console.log("SEARCH VEHICLE CALLED");
    console.trace();

    if (!plate.trim()) return;

    try {
      setLoading(true);

      const cleanPlate = plate.toUpperCase().replace(/\s+/g, "");

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

      setVehicleNotFound(true);
      setVehicleNotFound(false);

      if (error) throw error;

      if (error) throw error;

      if (!data) {
        setVehicle(null);

        setAvailableReward(null);

        setCustomerPoints(0);

        setSubscription(null);

        setSearchType("info");

        setSearchMessage("Vehicle not found. Register a new vehicle.");

        setCustomerPlate(cleanPlate);

        return;
      }

      const { data: subscription } = await supabase
        .from("subscription_members")
        .select("*")
        .eq("plate", cleanPlate)
        .eq("status", "active")
        .maybeSingle();

      if (data.vehicle_type_id) {
        setActiveVehicleType(String(data.vehicle_type_id));
      }

      setSubscription(subscription);

      setVehicle({
        ...data,
        subscription,
      });

      await checkAvailableRewards(data.customer_id);

      setSearchType("success");

      setSearchMessage(
        subscription
          ? `Subscription found (${subscription.plan})`
          : "Vehicle found successfully",
      );

      /* ==========================
SUBSCRIPTION SERVICES
========================== */

      if (subscription) {
        const renewalDate = subscription.renewal
          ? new Date(subscription.renewal)
          : null;

        const isExpired = renewalDate && renewalDate < new Date();

        const remainingWashes =
          Number(subscription.limit || 0) - Number(subscription.usage || 0);

        /* EXPIRED SUBSCRIPTION */
        if (isExpired) {
          setSearchType("info");

          setSearchMessage(
            `Subscription expired on ${subscription.renewal}. Proceed with normal payment.`,
          );
          console.log("CLEAR CART -> expired");
          console.trace("setCart");
          setCart([]);
          setCartOpen(false);
        } else if (remainingWashes > 0) {
          /* ACTIVE SUBSCRIPTION */
          let services: any[] = [];

          try {
            if (typeof subscription.services === "string") {
              services = JSON.parse(subscription.services);
            } else if (Array.isArray(subscription.services)) {
              services = subscription.services;
            }
          } catch (err) {
            console.error("Failed to parse subscription services", err);
            services = [];
          }

          const cartItems = services
            .map((service: any, index: number) => ({
              id: `subscription-${index}`,
              name: typeof service === "string" ? service : service?.name,
              quantity: 1,
              resolvedPrice: 0,
              total: 0,
              isSubscription: true,
            }))
            .filter((item) => item.name);
          console.trace("setCart");
          setCart(cartItems);

          if (cartItems.length > 0) {
            setCartOpen(true);
          }

          setSearchType("success");

          setSearchMessage(
            `Subscription found (${subscription.plan}) - ${remainingWashes} washes remaining`,
          );
        } else {
          /* ACTIVE BUT LIMIT REACHED */
          setSearchType("info");

          setSearchMessage(
            "Subscription wash limit reached. Proceed with normal payment.",
          );
          console.log("CLEARING CART FROM HERE");
          console.trace();
          setCart([]);
          setCartOpen(false);
        }
      }

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
            setAvailableReward(null);
            setAvailableRewards([]);
            setSelectedReward(null);
            setShowRewardDialog(false);

            return false;
          }

          /* ------------------------------------
       OPEN DIALOG
    ------------------------------------ */

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

      console.log("Reward redeemed:", data);

      // Store reward for invoice generation
      setRedeemReward(true);

      // Save redeemed reward
      setSelectedReward({
        ...selectedReward,
        redeemed: true,
      });

      // Update displayed customer points
      if (data?.points_remaining !== undefined) {
        setCustomerPoints(data.points_remaining);
      }

      setShowRewardDialog(false);

      alert(`${data.reward} redeemed successfully.`);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
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
    console.log("INSIDE addToCart");

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
   Complete Payment
========================================================= */
  const completePayment = async () => {
    if (!invoiceId) {
      alert("Generate invoice first");
      return;
    }

    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          payment_status: "PAID",
          status: "COMPLETED",
        })
        .eq("id", invoiceId);

      if (error) throw error;

      alert("Payment completed successfully");

      router.push("/invoices");
    } catch (err) {
      console.error(err);
      alert("Failed to complete payment");
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
    console.log("generateInvoice called");
    console.trace();

    console.log("===== GENERATE INVOICE =====");
    console.log("redeem:", redeem);
    console.log("invoiceCart:", invoiceCart);
    console.log("invoiceCart length:", invoiceCart.length);
    console.log("availableRewards:", availableRewards.length);
    console.log("selectedReward:", selectedReward);
    console.log("pendingInvoice:", pendingInvoice);

    if (availableRewards.length > 0 && !selectedReward) {
      console.log("Opening reward dialog...");

      setPendingInvoice(true);
      setShowRewardDialog(true);
      return;
    }
    if (!canOperate) {
      alert("Branch access invalid");
      return;
    }

    if (invoiceCart.length === 0) {
      console.log("Invoice cart is empty!");
      alert("Add services first");
      return;
    }

    try {
      setProcessingPayment(true);

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

      const subscriptionAvailable = subscription && remainingWashes > 0;

      const isSubscribed = !!subscription && remainingWashes > 0;
      const isReward = redeem;

      const finalTotal = isSubscribed || isReward ? 0 : grandTotal;

      const payload = {
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

      const { data, error } = await supabase
        .from("invoices")
        .insert([payload])
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      console.log("redeemReward:", redeemReward);
      console.log("selectedReward:", selectedReward);
      console.log("vehicle:", vehicle);
      console.log("customer_id:", vehicle?.customer_id);

      if (redeem && selectedReward && vehicle?.customer_id) {
        const rewardId = selectedReward.reward_id ?? selectedReward.id;

        console.log("Redeeming reward:", rewardId);

        const { data: redeemData, error: redeemError } = await supabase.rpc(
          "redeem_loyalty_reward",
          {
            p_customer_id: vehicle.customer_id,
            p_reward_id: rewardId,
          },
        );

        console.log(redeemData);
        console.log(redeemError);

        if (redeemError) {
          alert(redeemError.message);
          return;
        }
      }

      //autodeduct wash
      if (isSubscribed) {
        const { data, error } = await supabase
          .from("subscription_members")
          .update({
            usage: subscription.usage + 1,
          })
          .eq("id", subscription.id)
          .select();
      }

      if (isSubscribed || isReward) {
        setSubscription(null);

        setVehicle(null);

        setPlate("");
        console.log("CLEAR CART -> subscription");
        console.trace("setCart");
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

      const { error: queueError } = await supabase
        .from("queue_vehicles")
        .insert({
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

          invoice_id: data.id,

          branch_id: branchId,

          carwash_id: companyId,
        });

      if (queueError) {
        console.error("QUEUE ERROR:", queueError);
      }

      setInvoiceId(data.id);
      console.log("auto send to queue");
      console.trace("setCart");
      setCart([]);

      setNotes("");

      setDiscount(0);

      alert(`Receipt generated successfully.\nVehicle added to queue.`);
    } catch (err) {
      alert("Failed to process payment");
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

        <div className="border-b border-white/10 bg-[#07111F]">
          <div className="px-6 py-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10">
                  <Car className="h-8 w-8 text-cyan-400" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                    Multi Branch POS
                  </p>

                  <h1 className="text-4xl font-black">WashPro Terminal</h1>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-cyan-400" />

                      {currentBranchData?.name || "Main Branch"}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-400" />

                      {currentBranchData?.location || "No location"}
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />

                      {profile?.role || "Staff"}
                    </div>
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
                ? "xl:grid-cols-[1fr_420px]"
                : "grid-cols-1"
            }`}
          >
            {/* LEFT */}

            <div>
              {/* SEARCH */}

              <div className="rounded-3xl border border-white/10 bg-[#07111F] p-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="Search plate number..."
                      className="h-14 w-full rounded-2xl border border-white/10 bg-[#111827] pl-14 pr-5 text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    onClick={searchVehicle}
                    className="
                    h-14
                    px-4
                    sm:px-8
                    shrink-0
                    flex items-center justify-center gap-2
                    rounded-2xl
                    bg-cyan-500
                    font-bold text-white"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Searching
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>

                {searchMessage && (
                  <div
                    className={`mt-5 flex items-center justify-between rounded-2xl p-4 ${
                      searchType === "success"
                        ? "bg-green-500/10 text-green-300"
                        : searchType === "error"
                          ? "bg-red-500/10 text-red-300"
                          : "bg-yellow-500/10 text-yellow-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {searchType === "success" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : searchType === "error" ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Clock3 className="h-5 w-5" />
                      )}

                      <span className="text-sm font-medium">
                        {searchMessage}
                      </span>
                    </div>

                    {vehicleNotFound && (
                      <button
                        onClick={() => {
                          setCustomerPlate(plate);
                          setShowCustomerModal(true);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Add Vehicle
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* FILTERS */}

              <div className="mt-6 rounded-3xl border border-white/10 bg-[#07111F] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <input
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services..."
                    className="h-14 flex-1 rounded-2xl border border-white/10 bg-[#111827] px-5 text-white outline-none focus:border-cyan-500"
                  />

                  <select
                    value={activeVehicleType}
                    onChange={(e) => setActiveVehicleType(e.target.value)}
                    className="h-14 rounded-2xl border border-white/10 bg-[#111827] px-5 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="">All Vehicles</option>

                    {vehicleTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={openInvoices}
                    className="
                    flex h-12 items-center justify-center gap-2
                    rounded-2xl
                    bg-emerald-500
                    hover:bg-emerald-600
                    text-white
                    font-bold
                    shadow-lg
                    shadow-emerald-500/25
                    transition-all
                    duration-300
                    hover:scale-[1.02]
                    hover:shadow-emerald-500/40
                    "
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Payment
                  </button>
                </div>
              </div>

              {/* SERVICES */}

              <div
                className={`mt-6 grid gap-3 transition-all duration-300 ${
                  cartOpen && cart.length > 0
                    ? "grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"
                    : "grid-cols-3 md:grid-cols-4 xl:grid-cols-4"
                }`}
              >
                {filteredServices.map((item, i) => {
                  const Icon =
                    typeof item.icon === "function" ? item.icon : Droplets;

                  return (
                    <div
                      key={i}
                      className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F172A] to-[#081120] p-3 transition hover:-translate-y-2 hover:border-cyan-500/40"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
                          <Icon className="h-7 w-7 text-cyan-400" />
                        </div>

                        <div className="rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300">
                          {item.displayVehicle}
                        </div>
                      </div>

                      <div className="mt-5">
                        <h3 className="text-xl font-black">{item.name}</h3>

                        <p className="mt-3 min-h-[72px] text-sm text-slate-400">
                          {item.details?.[0]}
                        </p>

                        <div className="mt-5 flex items-end justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500">
                              Price
                            </p>

                            <h2 className="mt-1 text-3xl font-black text-cyan-400">
                              KSh{" "}
                              {Number(item.displayPrice || 0).toLocaleString()}
                            </h2>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              Duration
                            </p>

                            <p className="text-sm font-bold">{item.time}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={hasSubscriptionWash}
                        onClick={() => {
                          console.log("BUTTON CLICKED");
                          console.log(
                            "hasSubscriptionWash =",
                            hasSubscriptionWash,
                          );
                          console.log("item =", item.name);

                          if (hasSubscriptionWash) {
                            console.log("Blocked");
                            return;
                          }

                          console.log("Calling addToCart");

                          addToCart(item);
                        }}
                        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold
                            ${
                              hasSubscriptionWash
                                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                            }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add Service
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT CHECKOUT */}

            {cart.length > 0 && cartOpen && (
              <div
                className={`sticky top-4 h-fit transition-all duration-300 overflow-hidden ${
                  cartOpen ? "w-[420px]" : "w-[80px]"
                }`}
              >
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#07111F]">
                  <div className="border-b border-white/10 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
                          Checkout
                        </p>

                        <h2 className="mt-2 text-3xl font-black">POS Cart</h2>
                      </div>

                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-8 w-8 text-cyan-400" />

                        <button
                          onClick={() => setCartOpen(!cartOpen)}
                          className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                        >
                          {cartOpen ? "→" : "←"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CUSTOMER */}

                  <div className="border-b border-white/10 p-6">
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Customer
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      {vehicle?.customers?.name || "Walk-in Customer"}
                    </h3>

                    <div className="mt-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">
                      {vehicle?.plate_number || plate || "NO PLATE"}
                    </div>

                    {hasSubscriptionWash && (
                      <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
                        <p className="font-bold text-green-400">
                          Subscription Wash
                        </p>

                        <p className="text-sm text-green-300">
                          This customer will not be charged.
                        </p>

                        <p className="text-sm text-green-300">
                          1 wash will be deducted from subscription.
                        </p>
                      </div>
                    )}

                    {/* SUBSCRIPTION STATUS */}
                    {subscription && (
                      <>
                        {isExpired ? (
                          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                            <p className="font-bold text-red-400">
                              Subscription Expired
                            </p>

                            <p className="text-sm text-red-300">
                              Renewal date has passed.
                            </p>

                            <p className="text-sm text-red-300">
                              Customer must pay normally.
                            </p>
                          </div>
                        ) : hasSubscriptionWash ? (
                          <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
                            <p className="font-bold text-green-400">
                              Subscription Active
                            </p>

                            <p className="text-sm text-green-300">
                              Remaining Washes: {remainingWashes}
                            </p>

                            <p className="text-xs text-green-200">
                              Plan: {subscription.plan}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
                            <p className="font-bold text-orange-400">
                              Wash Limit Reached
                            </p>

                            <p className="text-sm text-orange-300">
                              Subscription washes have been fully utilized.
                            </p>

                            <p className="text-sm text-orange-300">
                              Customer will proceed to normal payment.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* CART */}

                  <div className="max-h-[400px] overflow-y-auto p-6">
                    {cart.length === 0 ? (
                      <div className="py-20 text-center">
                        <ShoppingCart className="mx-auto h-14 w-14 text-slate-700" />

                        <h3 className="mt-5 text-xl font-bold text-slate-300">
                          Cart Empty
                        </h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-white/10 bg-[#0B1220] p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold">{item.name}</h3>

                                <p className="mt-1 text-xs text-slate-500">
                                  {item.displayVehicle}
                                </p>
                              </div>

                              <button
                                onClick={() => removeFromCart(index)}
                                className="text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    updateQuantity(index, "decrease")
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10"
                                >
                                  -
                                </button>

                                <span className="font-bold">
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() =>
                                    updateQuantity(index, "increase")
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-slate-500">
                                  KSh {item.resolvedPrice} each
                                </p>

                                <h3 className="text-lg font-black text-cyan-400">
                                  KSh {Number(item.total || 0).toLocaleString()}
                                </h3>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PAYMENT */}

                  <div className="border-t border-white/10 p-6">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Cash",
                          value: "CASH",
                          icon: Wallet,
                        },
                        {
                          label: "Card",
                          value: "CARD",
                          icon: CreditCard,
                        },
                        {
                          label: "M-Pesa",
                          value: "MPESA",
                          icon: Smartphone,
                        },
                      ].map((method, i) => {
                        const Icon = method.icon;

                        return (
                          <button
                            key={i}
                            onClick={() => setPaymentMethod(method.value)}
                            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 ${
                              paymentMethod === method.value
                                ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                                : "border-white/10 bg-[#111827]"
                            }`}
                          >
                            <Icon className="h-5 w-5" />

                            <span className="text-xs font-bold">
                              {method.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        placeholder="Discount"
                        className="h-12 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white"
                      />

                      <input
                        type="number"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(Number(e.target.value))}
                        placeholder="Tax %"
                        className="h-12 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white"
                      />
                    </div>

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes..."
                      className="mt-4 min-h-[90px] w-full rounded-2xl border border-white/10 bg-[#111827] p-4 text-white"
                    />
                  </div>

                  {/* TOTALS */}

                  <div className="border-t border-white/10 bg-[#0B1220] p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Subtotal</span>

                        <span>KSh {subtotal.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Tax</span>

                        <span>KSh {taxAmount.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Discount</span>

                        <span className="text-red-400">
                          - KSh {discount.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                        <span className="text-lg font-bold">Total</span>

                        <h2 className="text-4xl font-black text-cyan-400">
                          KSh{" "}
                          {hasSubscriptionWash
                            ? "0"
                            : grandTotal.toLocaleString()}
                          {!(
                            subscription &&
                            subscription.limit - subscription.usage
                          ) && (
                            <div className="grid grid-cols-3 gap-3">
                              {/* Cash/Card/Mpesa buttons */}
                            </div>
                          )}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => generateInvoice()}
                          disabled={processingPayment}
                          className={`
    flex h-14 items-center justify-center gap-3 rounded-2xl
    font-bold text-white transition-all

    ${
      processingPayment
        ? "bg-slate-700 cursor-not-allowed opacity-80"
        : "bg-gradient-to-r from-yellow-500 to-orange-600 hover:opacity-90"
    }
  `}
                        >
                          {processingPayment ? (
                            <>
                              <RefreshCw className="h-5 w-5 animate-spin" />
                              Generating Receipt...
                            </>
                          ) : (
                            <>
                              <Receipt className="h-5 w-5" />
                              Generate Receipt
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setCart([])}
                          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 font-bold text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3"></div>
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
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
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
                className="h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 uppercase text-white"
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
                className="md:col-span-2 h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 text-white"
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
                className="fixed top-6 right-6 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
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

            <div className="max-h-[45vh] overflow-y-auto p-4 space-y-3">
              {availableRewards.map((reward) => {
                const selected = selectedReward?.id === reward.id;

                return (
                  <button
                    key={reward.id}
                    onClick={() => {
                      console.log("Reward selected", reward);

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
                    className={`w-full rounded-2xl border text-left transition

              ${
                selected
                  ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-400/30"
                  : "border-slate-700 bg-[#0B1220] hover:border-cyan-400"
              }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl

                  ${
                    selected
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-800 text-cyan-300"
                  }`}
                      >
                        <Sparkles className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-white">
                            {reward.title}
                          </h3>

                          {selected && (
                            <BadgeCheck className="h-4 w-4 text-green-400 shrink-0" />
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
                        <p className="text-[10px] uppercase tracking-wide text-cyan-300">
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
                <Star className="mt-0.5 h-4 w-4 text-yellow-300 shrink-0" />

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
                  className="flex-1 rounded-xl border border-slate-700 py-3 font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Skip
                </button>

                <button
                  disabled={!selectedReward}
                  onClick={async () => {
                    console.log("Redeem clicked");
                    console.log(
                      "selectedRewardService:",
                      selectedRewardService,
                    );

                    setShowRewardDialog(false);

                    if (!selectedRewardService) {
                      alert("Select a service");
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
          className="
      fixed
      bottom-6
      right-6
      z-50
      flex
      h-16
      w-16
      items-center
      justify-center
      rounded-full
      bg-cyan-500
      shadow-xl
      hover:scale-105
      transition
    "
        >
          <ShoppingCart className="h-7 w-7 text-white" />

          <span
            className="
      absolute
      -top-2
      -right-2
      flex
      h-6
      w-6
      items-center
      justify-center
      rounded-full
      bg-red-500
      text-xs
      font-bold
      text-white
    "
          >
            {cart.length}
          </span>
        </button>
      )}
    </>
  );
}
