"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Package,
  Search,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Filter,
  DollarSign,
  BadgeAlert,
  Sparkles,
  Plus,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* =====================================================
   TYPES
===================================================== */

type InventoryItem = {
  id: string;

  carwash_id?: string;
  branch_id?: string;

  item_name: string;
  sku?: string;
  category?: string;
  quantity?: number;
  minimum_stock?: number;
  cost_price?: number;
  supplier_name?: string;
  status?: string;
  created_at?: string;
  storage_location?: string;
  unit_type?: string;
};

type Profile = {
  id: string;

  carwash_id?: string;
  branch_id?: string;

  full_name?: string;
  email?: string;
};

/* =====================================================
   PAGE
===================================================== */

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* =====================================================
       ADD INVENTORY MODAL
    ===================================================== */

  const [showAddModal, setShowAddModal] = useState(false);

  const [newItem, setNewItem] = useState({
    item_name: "",
    category: "",
    quantity: 0,
    minimum_stock: 0,
    cost_price: 0,
    supplier_name: "",
    storage_location: "",
    unit_type: "",
  });

  /* =====================================================
   PRO FEATURES (UPGRADE READY)
===================================================== */

  const [showProPanel, setShowProPanel] = useState(false);

  /* STOCK ALERTS (future real-time trigger hook) */
  const lowStockAlerts = useMemo(() => {
    return inventory.filter(
      (item) => (item.quantity || 0) <= (item.minimum_stock || 0),
    );
  }, [inventory]);

  /* REORDER ACTION (placeholder for email + automation) */
  const handleReorder = async (item: InventoryItem) => {
    alert(
      `📦 Reorder triggered for: ${item.item_name}\n\n(Next upgrade: auto email + supplier API)`,
    );

    // FUTURE:
    // 1. Send email to supplier
    // 2. Create purchase order
    // 3. Log movement history
  };

  /* STOCK MOVEMENT LOG*/
  const logStockMovement = async ({
    itemId,
    type,
    qty,
    previousQty,
    newQty,
    branchFrom,
    branchTo,
    notes,
  }: {
    itemId: string;
    type:
      | "USE"
      | "RESTOCK"
      | "DAMAGE"
      | "LOSS"
      | "TRANSFER_OUT"
      | "TRANSFER_IN";

    qty: number;

    previousQty: number;
    newQty: number;

    branchFrom?: string;
    branchTo?: string;

    notes?: string;
  }) => {
    try {
      const { error } = await supabase.from("inventory_movements").insert([
        {
          carwash_id: profile?.carwash_id,
          branch_id: profile?.branch_id,

          item_id: itemId,
          movement_type: type,
          quantity: qty,
          previous_quantity: previousQty,
          new_quantity: newQty,
          branch_from: branchFrom,
          branch_to: branchTo,
          notes,
        },
      ]);

      if (error) {
      }
    } catch (err) {}
  };
  /* =====================================================
           LOAD USER PROFILE
        ===================================================== */
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, []);

  /* =====================================================
       LOAD INVENTORY
    ===================================================== */

  const loadAllData = async () => {
    setLoading(true);

    if (!profile?.carwash_id) {
      setInventory([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("inventory_items")
      .select("*")
      .eq("carwash_id", profile?.carwash_id);

    if (profile.branch_id) {
      query = query.eq("branch_id", profile.branch_id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      setInventory([]);
      setLoading(false);
      return;
    }

    setInventory(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadAllData();
    }
  }, [profile]);

  /* =====================================================
       REFRESH
    ===================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  /* =====================================================
       STOCK UPDATE
    ===================================================== */

  const useStock = async (itemId: string, usedQuantity: number) => {
    try {
      const item = inventory.find((i) => String(i.id) === String(itemId));

      if (!item) return alert("Item not found");

      const currentQty = Number(item.quantity || 0);

      if (currentQty < usedQuantity) {
        return alert("Not enough stock");
      }

      const newQty = currentQty - usedQuantity;

      await logStockMovement({
        itemId,
        type: "USE",
        qty: usedQuantity,
        previousQty: currentQty,
        newQty,
        notes: "Stock used from inventory",
      });

      const { error } = await supabase
        .from("inventory_items")
        .update({
          quantity: newQty,
          status:
            newQty <= 0
              ? "out_of_stock"
              : newQty <= Number(item.minimum_stock || 0)
                ? "low_stock"
                : "active",
        })
        .eq("id", itemId)
        .eq("carwash_id", profile?.carwash_id);

      if (error) {
        return alert(error.message);
      }

      await loadAllData();
    } catch (err) {}
  };

  /* =====================================================
   ADD STOCK
===================================================== */

  const addStock = async (itemId: string, quantityToAdd: number) => {
    try {
      const item = inventory.find((i) => String(i.id) === String(itemId));

      if (!item) return alert("Item not found");

      const newQty = Number(item.quantity || 0) + quantityToAdd;

      await logStockMovement({
        itemId,
        type: "RESTOCK",
        qty: quantityToAdd,
        previousQty: Number(item.quantity || 0),
        newQty,
        notes: "Stock added manually",
      });

      const { error } = await supabase
        .from("inventory_items")
        .update({
          quantity: newQty,
          status:
            newQty <= Number(item.minimum_stock || 0) ? "low_stock" : "active",
        })
        .eq("id", itemId)
        .eq("carwash_id", profile?.carwash_id);

      if (error) {
        return alert(error.message);
      }

      await loadAllData();
    } catch (err) {}
  };

  /* =====================================================
       FULL RESTOCK
    ===================================================== */

  const restockItem = async (itemId: string) => {
    try {
      const item = inventory.find((i) => String(i.id) === String(itemId));

      if (!item) return alert("Item not found");

      const restockAmount = Number(prompt("Enter restock quantity", "10"));

      if (!restockAmount || restockAmount <= 0) {
        return;
      }

      const newQty = Number(item.quantity || 0) + restockAmount;

      const { error } = await supabase
        .from("inventory_items")
        .update({
          quantity: newQty,
          status: "active",
        })
        .eq("id", itemId)
        .eq("carwash_id", profile?.carwash_id);

      if (error) {
        console.log(error.message);
        return alert(error.message);
      }

      await loadAllData();
    } catch (err) {
      console.log(err);
    }
  };

  const transferStock = async (itemId: string) => {
    try {
      const item = inventory.find((i) => String(i.id) === String(itemId));

      if (!item) return;

      const transferQty = Number(prompt("Transfer quantity", "1"));

      if (!transferQty || transferQty <= 0) return;

      const branch = prompt("Transfer to branch", "Branch B");

      if (!branch) return;

      const currentQty = Number(item.quantity || 0);

      const newQty = currentQty - transferQty;

      await supabase
        .from("inventory_items")
        .update({
          quantity: newQty,
        })
        .eq("id", itemId)
        .eq("carwash_id", profile?.carwash_id);

      await logStockMovement({
        itemId,
        type: "TRANSFER_OUT",
        qty: transferQty,
        previousQty: currentQty,
        newQty,
        branchFrom: "Main Branch",
        branchTo: branch,
        notes: "Inventory transferred",
      });

      await loadAllData();
    } catch (err) {
      console.log(err);
    }
  };

  /* =====================================================
       CREATE INVENTORY ITEM
    ===================================================== */
  const deleteItem = async (id: string) => {
    const confirmDelete = confirm("Delete this inventory item?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id)
      .eq("carwash_id", profile?.carwash_id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAllData();
  };

  const createInventoryItem = async () => {
    try {
      if (!newItem.item_name) {
        return alert("Item name is required");
      }

      const { error } = await supabase.from("inventory_items").insert([
        {
          ...newItem,
          carwash_id: profile?.carwash_id,
          branch_id: profile?.branch_id,

          status:
            Number(newItem.quantity) <= Number(newItem.minimum_stock)
              ? "low_stock"
              : "active",
        },
      ]);

      if (error) {
        console.log(error.message);
        return alert(error.message);
      }

      alert("Inventory item added");

      setShowAddModal(false);

      setNewItem({
        item_name: "",
        category: "",
        quantity: 0,
        minimum_stock: 0,
        cost_price: 0,
        supplier_name: "",
        storage_location: "",
        unit_type: "",
      });

      await loadAllData();
    } catch (err) {
      console.log(err);
    }
  };

  /* =====================================================
       FILTERED INVENTORY
    ===================================================== */

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        item.item_name?.toLowerCase().includes(searchText) ||
        item.sku?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (item.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, search, categoryFilter, statusFilter]);

  /* =====================================================
       STATS
    ===================================================== */

  const totalItems = inventory.length;

  const totalStockValue = inventory.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.cost_price || 0),
    0,
  );

  const lowStockItems = inventory.filter(
    (item) => (item.quantity || 0) <= (item.minimum_stock || 0),
  );

  const outOfStockItems = inventory.filter((item) => (item.quantity || 0) <= 0);

  const categories = useMemo(() => {
    return [
      ...new Set(
        inventory.map((i) => i.category).filter((c): c is string => Boolean(c)),
      ),
    ];
  }, [inventory]);

  /* =====================================================
       LOADING
    ===================================================== */

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4 text-slate-300">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading inventory...
        </div>
      </div>
    );
  }

  /* =====================================================
       UI
    ===================================================== */

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-semibold tracking-wider text-emerald-400 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Inventory Engine
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
            Inventory Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Real-time stock tracking, usage control, and warehouse visibility in
            one system.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            className="bg-slate-900 border border-slate-800 text-white hover:border-emerald-500/30 hover:bg-slate-800 transition"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>

          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>

          <Button
            onClick={() => setShowProPanel(!showProPanel)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Pro Upgrade
          </Button>
        </div>
      </div>

      {/* =====================================================
   STATS (REDESIGNED)
===================================================== */}

      <div className="grid grid-cols-4 gap-2 md:gap-5">
        {/* TOTAL ITEMS */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 text-white shadow-lg transition hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-blue-500/10">
          <CardContent className="p-2 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 truncate">
                Items
              </p>

              <h2 className="mt-1 text-lg sm:text-3xl font-black text-white">
                {totalItems}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-2 sm:p-4">
              <Package className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        {/* STOCK VALUE */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 text-white shadow-lg transition hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-emerald-500/10">
          <CardContent className="p-2 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 truncate">
                Value
              </p>

              <h2 className="mt-1 text-xs sm:text-3xl font-black text-emerald-400">
                KES {totalStockValue.toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-400 shadow-inner shadow-emerald-500/20">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* LOW STOCK */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 text-white shadow-lg transition hover:-translate-y-1 hover:border-yellow-500/30 hover:shadow-yellow-500/10">
          <CardContent className="p-2 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 truncate">
                Low
              </p>

              <h2 className="mt-1 text-lg sm:text-3xl font-black text-yellow-400">
                {lowStockItems.length}
              </h2>
            </div>

            <div className="rounded-2xl bg-yellow-500/10 p-4 text-yellow-400 shadow-inner shadow-yellow-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* OUT OF STOCK */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 text-white shadow-lg transition hover:-translate-y-1 hover:border-red-500/30 hover:shadow-red-500/10">
          <CardContent className="p-2 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 truncate">
                Out
              </p>

              <h2 className="mt-1 text-lg sm:text-3xl font-black text-red-400">
                {outOfStockItems.length}
              </h2>
            </div>

            <div className="rounded-2xl bg-red-500/10 p-4 text-red-400 shadow-inner shadow-red-500/20">
              <BadgeAlert className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-950/60 backdrop-blur-md">
        <CardContent className="p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />

              <Input
                placeholder="Search items, SKU, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-800 text-white focus:border-emerald-500/40"
              />
            </div>

            {/* CATEGORY */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-full bg-slate-900 border-slate-800">
                <SelectValue placeholder="Category" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>

                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* STATUS */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full bg-slate-900 border-slate-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* FILTER BUTTON */}
            <Button
              variant="outline"
              className="h-10 border-slate-800 hover:border-emerald-500/30"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="border-slate-800 bg-slate-950/60 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/70 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="p-4 text-left">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.map((item) => {
                  const low = (item.quantity || 0) <= (item.minimum_stock || 0);

                  const out = (item.quantity || 0) <= 0;

                  return (
                    <tr
                      key={item.id}
                      className={`
                                                border-b border-slate-900 transition
                                                ${
                                                  out
                                                    ? "bg-red-500/5 hover:bg-red-500/10"
                                                    : low
                                                      ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                                                      : "hover:bg-slate-900/40"
                                                }  
                                                        `}
                    >
                      <td className="p-4 font-semibold text-white">
                        {item.item_name}
                      </td>

                      <td className="p-4 text-slate-400">{item.category}</td>

                      <td className="p-4 text-white">{item.quantity}</td>

                      <td className="p-4 text-emerald-400">
                        KES {item.cost_price}
                      </td>

                      <td className="p-4">
                        {out ? (
                          <span className="text-red-400">Out</span>
                        ) : low ? (
                          <span className="text-yellow-400">Low</span>
                        ) : (
                          <span className="text-emerald-400">Active</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2 justify-end w-full">
                          {/* USE STOCK */}
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => useStock(item.id, 1)}
                          >
                            Use 1
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItem(item.id)}
                          >
                            Delete
                          </Button>

                          {/* RESTOCK */}
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => {
                              restockItem(item.id);
                            }}
                          >
                            Restock
                          </Button>

                          <Button
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-600"
                            onClick={() => transferStock(item.id)}
                          >
                            Transfer
                          </Button>

                          {/* DAMAGED */}
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={async () => {
                              const damageQty = Number(
                                prompt("Damaged quantity", "1"),
                              );

                              if (!damageQty || damageQty <= 0) return;

                              const currentQty = Number(item.quantity || 0);

                              const newQty = currentQty - damageQty;

                              await supabase
                                .from("inventory_items")
                                .update({
                                  quantity: newQty,
                                })
                                .eq("id", item.id);

                              await logStockMovement({
                                itemId: item.id,
                                type: "DAMAGE",
                                qty: damageQty,
                                previousQty: currentQty,
                                newQty,
                                notes: "Damaged stock removed",
                              });

                              await loadAllData();
                            }}
                          >
                            Damaged
                          </Button>

                          {/* LOST */}
                          <Button
                            size="sm"
                            className="bg-pink-500 hover:bg-pink-600"
                            onClick={async () => {
                              const lostQty = Number(
                                prompt("Lost quantity", "1"),
                              );

                              if (!lostQty || lostQty <= 0) return;

                              const currentQty = Number(item.quantity || 0);

                              const newQty = currentQty - lostQty;

                              await supabase
                                .from("inventory_items")
                                .update({
                                  quantity: newQty,
                                })
                                .eq("id", item.id);

                              await logStockMovement({
                                itemId: item.id,
                                type: "LOSS",
                                qty: lostQty,
                                previousQty: currentQty,
                                newQty,
                                notes: "Lost inventory",
                              });

                              await loadAllData();
                            }}
                          >
                            Lost
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showProPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-300">
            <Card className="border-purple-500/30 bg-slate-950 shadow-2xl shadow-purple-500/20">
              <CardContent className="p-6 space-y-5">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-purple-400" />
                      Pro Inventory System
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Advanced enterprise inventory features
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowProPanel(false)}
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </div>

                {/* FEATURES */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-lg">🔔</div>
                    <h3 className="mt-2 font-bold text-white">
                      Stock Alerts Popup
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {lowStockAlerts.length} items currently need attention
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-lg">📦</div>
                    <h3 className="mt-2 font-bold text-white">
                      Auto Reorder System
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Email suppliers automatically when stock is low
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-lg">📊</div>
                    <h3 className="mt-2 font-bold text-white">
                      Analytics Dashboard
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Visual usage trends & stock consumption charts
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-lg">🏷️</div>
                    <h3 className="mt-2 font-bold text-white">
                      Barcode Support
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Scan products instantly using mobile camera
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl">
            <Card className="border-slate-800 bg-slate-950 shadow-2xl">
              <CardContent className="p-6 space-y-5">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      Add Inventory Item
                    </h2>

                    <p className="text-sm text-slate-400 mt-1">
                      Create a new stock item
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="border-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* FORM */}
                <div className="grid gap-5 md:grid-cols-2">
                  {/* ITEM NAME */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Item Name
                    </label>

                    <Input
                      placeholder="Snow Foam Soap"
                      value={newItem.item_name}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          item_name: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Enter the exact inventory product name.
                    </p>
                  </div>

                  {/* CATEGORY */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Category
                    </label>

                    <Input
                      placeholder="Cleaning Chemicals"
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          category: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Group similar inventory items together.
                    </p>
                  </div>

                  {/* QUANTITY */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Initial Quantity
                    </label>

                    <Input
                      type="number"
                      placeholder="50"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantity: Number(e.target.value),
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Current stock amount available.
                    </p>
                  </div>

                  {/* MINIMUM STOCK */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Minimum Stock Level
                    </label>

                    <Input
                      type="number"
                      placeholder="10"
                      value={newItem.minimum_stock}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          minimum_stock: Number(e.target.value),
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Alert level before stock becomes low.
                    </p>
                  </div>

                  {/* COST PRICE */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Cost Price (KES)
                    </label>

                    <Input
                      type="number"
                      placeholder="2500"
                      value={newItem.cost_price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          cost_price: Number(e.target.value),
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Buying cost per item/unit.
                    </p>
                  </div>

                  {/* SUPPLIER */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Supplier Name
                    </label>

                    <Input
                      placeholder="Nairobi Auto Supplies Ltd"
                      value={newItem.supplier_name}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          supplier_name: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Company or person supplying the item.
                    </p>
                  </div>

                  {/* STORAGE LOCATION */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Storage Location
                    </label>

                    <Input
                      placeholder="Shelf A - Warehouse 2"
                      value={newItem.storage_location}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          storage_location: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Physical location where item is stored.
                    </p>
                  </div>

                  {/* UNIT TYPE */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Unit Type
                    </label>

                    <Input
                      placeholder="Litres, Bottles, Pieces"
                      value={newItem.unit_type}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          unit_type: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-800 text-white"
                    />

                    <p className="text-xs text-slate-500">
                      Measurement unit used for this inventory item.
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="border-slate-700"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={createInventoryItem}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Save Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
