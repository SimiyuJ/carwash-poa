"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";

import {
  Car,
  CreditCard,
  Star,
  CalendarCheck,
  User,
} from "lucide-react";

export default function CustomerProfileDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    name: "",
    email: "",
    vehicles: 0,
    subscriptions: 0,
    loyaltyPoints: 0,
    totalWashes: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 🔹 Get logged-in user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      // 🔹 Profile info
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, loyalty_points")
        .eq("id", user.id)
        .single();

      // 🔹 Vehicles
      const { count: vehiclesCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // 🔹 Subscriptions
      const { count: subscriptionsCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // 🔹 Wash history
      const { count: washCount } = await supabase
        .from("wash_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        name: profile?.full_name || "Customer",
        email: profile?.email || user.email || "",
        loyaltyPoints: profile?.loyalty_points || 0,
        vehicles: vehiclesCount || 0,
        subscriptions: subscriptionsCount || 0,
        totalWashes: washCount || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Customer Profile Dashboard</h1>
        <p className="text-gray-500">
          Manage your account overview and activity
        </p>
      </div>

      {/* LOADING */}
      {loading ? (
        <p className="text-gray-500">Loading profile...</p>
      ) : (
        <>
          {/* USER CARD */}
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <User className="text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">{stats.name}</h2>
                <p className="text-gray-500 text-sm">{stats.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Car className="text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Vehicles</p>
                  <h2 className="text-xl font-bold">{stats.vehicles}</h2>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CreditCard className="text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Subscriptions</p>
                  <h2 className="text-xl font-bold">
                    {stats.subscriptions}
                  </h2>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Star className="text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Loyalty Points</p>
                  <h2 className="text-xl font-bold">
                    {stats.loyaltyPoints}
                  </h2>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CalendarCheck className="text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Total Washes</p>
                  <h2 className="text-xl font-bold">{stats.totalWashes}</h2>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}