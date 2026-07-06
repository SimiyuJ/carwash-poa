"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBranch } from "@/components/providers/ActiveBranchProvider";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Award,
  Star,
  Gift,
  Trophy,
  Crown,
  Sparkles,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

export default function LoyaltyPage() {
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState<string | null>(null);

  const [loyalty, setLoyalty] = useState({
    currentPoints: 0,
    tier: "Bronze",
    earned: 0,
    redeemed: 0,
    freeWashes: 0,
  });

  const [activities, setActivities] = useState<any[]>([]);

  const [rewards, setRewards] = useState<any[]>([]);

  const { activeBranch, isReady } = useActiveBranch();

  const tierTarget = {
    Bronze: 500,
    Silver: 1500,
    Gold: 5000,
    Platinum: 10000,
  };

  const nextTier =
    loyalty?.tier === "Bronze"
      ? 500
      : loyalty?.tier === "Silver"
        ? 1500
        : loyalty?.tier === "Gold"
          ? 10000
          : 10000;

  const progress = Math.min(
    ((loyalty?.currentPoints || 0) / nextTier) * 100,
    100,
  );

  useEffect(() => {
    if (!activeBranch?.id) return;

    loadLoyalty();
  }, [activeBranch?.id]);

  async function loadLoyalty() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: customer } = await supabase
        .from("customers")
        .select(
          `
      id,
      loyalty_points,
      loyalty_level
    `,
        )
        .eq("profile_id", user.id)
        .eq("branch_id", activeBranch?.id)
        .single();

      if (!customer) return;

      setCustomerId(customer.id);

      const { data: history } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("branch_id", activeBranch?.id)
        .order("created_at", {
          ascending: false,
        });

      const earned =
        history
          ?.filter((x) => x.transaction_type === "earned")
          .reduce((a, b) => a + Number(b.points || 0), 0) || 0;

      const redeemed =
        history
          ?.filter((x) => x.transaction_type === "redeemed")
          .reduce((a, b) => a + Number(b.points || 0), 0) || 0;

      const currentPoints = Number(customer?.loyalty_points || 0);

      const loyaltyLevel = customer?.loyalty_level || "Bronze";

      setLoyalty({
        currentPoints,
        tier: loyaltyLevel,
        earned,
        redeemed,
        freeWashes: Math.floor(currentPoints / 100),
      });

      setActivities(history || []);

      const { data: rewardData } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("active", true)
        .eq("branch_id", activeBranch?.id);

      setRewards(rewardData || []);
    } finally {
      setLoading(false);
    }
  }

  async function redeemReward(rewardId: string) {
    try {
      const { data, error } = await supabase.rpc("redeem_loyalty_reward", {
        p_customer_id: customerId,
        p_reward_id: rewardId,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert(`Successfully redeemed ${data.reward}`);

      await loadLoyalty();
    } catch {
      alert("Unable to redeem reward");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!loyalty) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        No loyalty account found for this branch
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* HERO */}

      <div
        className="
          rounded-[32px]
          p-8
          mb-8
          border border-[#1A2D4D]
          bg-gradient-to-r
          from-[#07142B]
          via-[#0A1D3D]
          to-[#07142B]
        "
      >
        <div className="flex justify-between">
          <div>
            <p className="text-cyan-400 font-semibold uppercase tracking-[4px]">
              Loyalty Program
            </p>

            <h1 className="text-5xl font-black mt-2">Rewards Dashboard</h1>

            <p className="text-slate-400 mt-3">
              Earn automatically after completed invoices
            </p>

            <div className="mt-8">
              <p className="text-slate-500">Membership</p>

              <h2 className="text-4xl font-black text-yellow-400">
                {loyalty.tier}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <Crown className="h-12 w-12 text-yellow-400 ml-auto" />

            <h2 className="text-6xl font-black text-cyan-400 mt-4">
              {loyalty.currentPoints}
            </h2>

            <p className="text-slate-500">Available Points</p>
          </div>
        </div>
      </div>

      {/* STATS */}

      <div className="grid xl:grid-cols-4 gap-5">
        {[
          {
            label: "Points",
            value: loyalty.currentPoints,
            icon: Star,
          },
          {
            label: "Earned",
            value: loyalty.earned,
            icon: Award,
          },
          {
            label: "Redeemed",
            value: loyalty.redeemed,
            icon: Gift,
          },
          {
            label: "Free Washes",
            value: loyalty.freeWashes,
            icon: Trophy,
          },
        ].map((item) => (
          <Card
            key={item.label}
            className="
                rounded-[28px]
                border
                border-[#1A2D4D]
                bg-[#07142B]
              "
          >
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-slate-500">{item.label}</p>

                  <h2 className="text-4xl font-black mt-2">{item.value}</h2>
                </div>

                <item.icon className="text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PROGRESS */}

      <Card className="mt-6 rounded-[32px] border border-cyan-500/20 bg-[#07142B]">
        <CardContent className="p-7">
          <div className="flex justify-between">
            <h2 className="text-2xl font-black">Tier Progress</h2>

            <span className="text-cyan-400">{progress.toFixed(0)}%</span>
          </div>

          <div className="h-5 rounded-full bg-[#091A34] overflow-hidden mt-6">
            <div
              className="
                h-full
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
              "
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* REWARDS */}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {rewards.map((reward) => (
          <Card
            key={reward.id}
            className="
                rounded-[28px]
                border
                border-[#1A2D4D]
                bg-[#07142B]
              "
          >
            <CardContent className="p-6">
              <Gift className="text-cyan-400 mb-5" />

              <h3 className="text-xl font-black">{reward.title}</h3>

              <p className="text-slate-500 mt-2">{reward.description}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-slate-400">Cost</span>

                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold">
                  {reward.points_required} pts
                </span>
              </div>

              <div className="mt-6">
                <Button
                  className={`w-full h-14 ${
                    loyalty.currentPoints >= reward.points_required
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                      : "bg-slate-800 text-slate-400"
                  }`}
                  disabled={loyalty.currentPoints < reward.points_required}
                  onClick={() => redeemReward(reward.id)}
                >
                  {loyalty.currentPoints >= reward.points_required
                    ? "Redeem Reward"
                    : "Not Enough Points"}

                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>

                {loyalty.currentPoints < reward.points_required && (
                  <p className="mt-2 text-sm text-yellow-400">
                    Need {reward.points_required - loyalty.currentPoints} more
                    points
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
