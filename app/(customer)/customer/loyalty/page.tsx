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
    <div
      className="
    relative
    min-h-screen
    overflow-hidden

    bg-gradient-to-br
    from-[#07142B]
    via-[#081A33]
    to-[#07142B]

    text-slate-100
  "
    >
      {/* Background Glow */}
      <div
        className="
      pointer-events-none
      absolute
      inset-0
      overflow-hidden
    "
      >
        <div
          className="
        absolute
        -top-40
        -right-40
        h-[420px]
        w-[420px]
        rounded-full
        bg-cyan-500/10
        blur-[140px]
      "
        />

        <div
          className="
        absolute
        bottom-0
        -left-32
        h-[320px]
        w-[320px]
        rounded-full
        bg-sky-500/10
        blur-[120px]
      "
        />

        <div
          className="
        absolute
        inset-0
        opacity-[0.03]
        [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)]
        [background-size:28px_28px]
      "
        />
      </div>

      {/* Content */}
      <div
        className="
      relative
      z-10

      mx-auto
      w-full
      max-w-7xl

      px-4
      py-5

      sm:px-6
      sm:py-6

      lg:px-8
      lg:py-8

      space-y-6
      lg:space-y-8
    "
      >
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

        {/* ================= STATS ================= */}

        <div
          className="
    grid
    grid-cols-4
    gap-3

    lg:gap-5
  "
        >
          {[
            {
              label: "Points",
              value: loyalty.currentPoints.toLocaleString(),
              icon: Star,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
              border: "border-cyan-500/20",
            },
            {
              label: "Earned",
              value: loyalty.earned.toLocaleString(),
              icon: Award,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20",
            },
            {
              label: "Redeemed",
              value: loyalty.redeemed.toLocaleString(),
              icon: Gift,
              color: "text-violet-400",
              bg: "bg-violet-500/10",
              border: "border-violet-500/20",
            },
            {
              label: "Free",
              value: loyalty.freeWashes,
              icon: Trophy,
              color: "text-yellow-400",
              bg: "bg-yellow-500/10",
              border: "border-yellow-500/20",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.label}
                className="
          group

          overflow-hidden

          rounded-[26px]

          border
          border-cyan-500/15

          bg-gradient-to-br
          from-[#081A33]
          via-[#091B37]
          to-[#07142B]

          shadow-[0_15px_40px_rgba(0,0,0,.25)]

          transition-all
          duration-300

          hover:-translate-y-1
          hover:border-cyan-500/30
          hover:shadow-[0_20px_45px_rgba(34,211,238,.12)]
        "
              >
                <CardContent
                  className="
            p-3

            sm:p-4

            lg:p-6
          "
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`
                mb-3

                flex
                h-10
                w-10

                lg:h-12
                lg:w-12

                items-center
                justify-center

                rounded-2xl

                border
                ${item.border}

                ${item.bg}
              `}
                    >
                      <Icon
                        className={`
                  h-5
                  w-5

                  lg:h-6
                  lg:w-6

                  ${item.color}
                `}
                      />
                    </div>

                    <h3
                      className="
                text-lg
                font-black

                leading-none

                sm:text-xl
                lg:text-3xl
              "
                    >
                      {item.value}
                    </h3>

                    <p
                      className="
                mt-2

                text-[10px]
                font-medium

                uppercase
                tracking-wide

                text-slate-400

                sm:text-xs
              "
                    >
                      {item.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ================= TIER PROGRESS ================= */}

        <Card
          className="
    overflow-hidden

    rounded-[36px]

    border
    border-cyan-500/15

    bg-gradient-to-br
    from-[#081A33]
    via-[#091B37]
    to-[#07142B]

    shadow-[0_20px_60px_rgba(0,0,0,.35)]
  "
        >
          <CardContent className="p-0">
            {/* Header */}

            <div
              className="
        border-b
        border-white/5

        bg-gradient-to-r
        from-cyan-500/10
        via-sky-500/5
        to-transparent

        p-6
        lg:p-7
      "
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="
              flex
              h-14
              w-14
              items-center
              justify-center

              rounded-3xl

              border
              border-cyan-500/20

              bg-cyan-500/10
            "
                  >
                    <Crown className="h-7 w-7 text-cyan-400" />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">
                      MEMBERSHIP
                    </p>

                    <h2 className="mt-1 text-3xl font-black text-white">
                      Tier Progress
                    </h2>

                    <p className="mt-1 text-slate-400">
                      Continue earning points to unlock premium benefits.
                    </p>
                  </div>
                </div>

                <div
                  className="
            inline-flex
            items-center
            gap-2

            rounded-full

            border
            border-cyan-500/20

            bg-cyan-500/10

            px-5
            py-2
          "
                >
                  <Sparkles className="h-4 w-4 text-cyan-400" />

                  <span className="font-bold text-cyan-400">
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}

            <div className="p-6 lg:p-7">
              {/* Current Tier */}

              <div
                className="
          flex
          flex-col
          gap-5

          lg:flex-row
          lg:items-center
          lg:justify-between
        "
              >
                <div>
                  <p className="text-sm text-slate-400">Current Membership</p>

                  <div className="mt-2 flex items-center gap-3">
                    <Crown className="h-7 w-7 text-yellow-400" />

                    <h2 className="text-4xl font-black text-yellow-400">
                      {loyalty.tier}
                    </h2>
                  </div>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-sm text-slate-400">Points Needed</p>

                  <h3 className="mt-2 text-3xl font-black text-cyan-400">
                    {Math.max(
                      nextTier - loyalty.currentPoints,
                      0,
                    ).toLocaleString()}
                  </h3>
                </div>
              </div>

              {/* Progress */}

              <div className="mt-8">
                <div className="flex justify-between text-sm text-slate-400 mb-3">
                  <span>{loyalty.currentPoints.toLocaleString()} pts</span>

                  <span>{nextTier.toLocaleString()} pts</span>
                </div>

                <div
                  className="
            relative

            h-4

            overflow-hidden

            rounded-full

            bg-[#0B1D38]
          "
                >
                  <div
                    className="
              h-full

              rounded-full

              bg-gradient-to-r
              from-cyan-500
              via-sky-500
              to-blue-600

              transition-all
              duration-700
            "
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>

              {/* Tier Milestones */}

              <div
                className="
          mt-8

          grid
          grid-cols-4

          gap-4
        "
              >
                {[
                  {
                    name: "Bronze",
                    target: 0,
                  },
                  {
                    name: "Silver",
                    target: 500,
                  },
                  {
                    name: "Gold",
                    target: 1500,
                  },
                  {
                    name: "Platinum",
                    target: 5000,
                  },
                ].map((tier) => {
                  const unlocked = loyalty.currentPoints >= tier.target;

                  return (
                    <div key={tier.name} className="text-center">
                      <div
                        className={`
                  mx-auto

                  flex
                  h-12
                  w-12

                  items-center
                  justify-center

                  rounded-full

                  border

                  ${
                    unlocked
                      ? `
                        border-cyan-500/30
                        bg-cyan-500/15
                      `
                      : `
                        border-white/10
                        bg-white/5
                      `
                  }
                `}
                      >
                        <Crown
                          className={`
                    h-5
                    w-5

                    ${unlocked ? "text-cyan-400" : "text-slate-500"}
                  `}
                        />
                      </div>

                      <p
                        className={`
                  mt-3

                  text-xs
                  font-semibold

                  ${unlocked ? "text-white" : "text-slate-500"}
                `}
                      >
                        {tier.name}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}

              <div
                className="
          mt-8

          rounded-3xl

          border
          border-cyan-500/10

          bg-cyan-500/[0.04]

          p-5
        "
              >
                <div className="flex items-start gap-4">
                  <Award className="mt-1 h-6 w-6 text-cyan-400" />

                  <div>
                    <h3 className="font-bold text-white">
                      You're getting closer!
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Earn another{" "}
                      <span className="font-semibold text-cyan-400">
                        {Math.max(
                          nextTier - loyalty.currentPoints,
                          0,
                        ).toLocaleString()}{" "}
                        points
                      </span>{" "}
                      to unlock the next membership tier and enjoy even more
                      exclusive discounts, rewards, and priority booking
                      benefits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================= REWARDS STORE ================= */}

        <div className="space-y-6">
          {/* Section Header */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">
                REWARDS STORE
              </p>

              <h2 className="mt-2 text-4xl font-black text-white">
                Redeem Your Rewards
              </h2>

              <p className="mt-2 text-slate-400">
                Exchange your loyalty points for exclusive washes, upgrades and
                member benefits.
              </p>
            </div>

            <div
              className="
        inline-flex
        items-center
        gap-3

        rounded-full

        border
        border-cyan-500/20

        bg-cyan-500/10

        px-5
        py-3
      "
            >
              <Star className="h-5 w-5 text-cyan-400" />

              <span className="font-bold text-cyan-400">
                {loyalty.currentPoints.toLocaleString()} Available Points
              </span>
            </div>
          </div>

          {/* Rewards */}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rewards.map((reward) => {
              const canRedeem = loyalty.currentPoints >= reward.points_required;

              const remaining = Math.max(
                reward.points_required - loyalty.currentPoints,
                0,
              );

              const rewardProgress = Math.min(
                (loyalty.currentPoints / reward.points_required) * 100,
                100,
              );

              return (
                <Card
                  key={reward.id}
                  className="
            group

            overflow-hidden

            rounded-[34px]

            border
            border-cyan-500/15

            bg-gradient-to-br
            from-[#081A33]
            via-[#091B37]
            to-[#07142B]

            shadow-[0_20px_50px_rgba(0,0,0,.30)]

            transition-all
            duration-300

            hover:-translate-y-1
            hover:border-cyan-500/30
          "
                >
                  <CardContent className="p-7">
                    {/* Badge */}

                    <div className="flex items-center justify-between">
                      <div
                        className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center

                  rounded-3xl

                  bg-cyan-500/10

                  border
                  border-cyan-500/20
                "
                      >
                        <Gift className="h-7 w-7 text-cyan-400" />
                      </div>

                      <span
                        className={`
                  rounded-full

                  px-4
                  py-2

                  text-xs
                  font-bold

                  ${
                    canRedeem
                      ? `
                        bg-emerald-500/15
                        text-emerald-400
                        border
                        border-emerald-500/20
                      `
                      : `
                        bg-yellow-500/10
                        text-yellow-400
                        border
                        border-yellow-500/20
                      `
                  }
                `}
                      >
                        {canRedeem ? "Available" : "Keep Earning"}
                      </span>
                    </div>

                    {/* Reward */}

                    <h3 className="mt-6 text-2xl font-black text-white">
                      {reward.title}
                    </h3>

                    <p className="mt-3 leading-7 text-slate-400">
                      {reward.description}
                    </p>

                    {/* Cost */}

                    <div
                      className="
                mt-6

                flex
                items-center
                justify-between
              "
                    >
                      <span className="text-slate-400">Redemption Cost</span>

                      <span
                        className="
                  rounded-full

                  bg-cyan-500/10

                  border
                  border-cyan-500/20

                  px-4
                  py-2

                  font-bold
                  text-cyan-400
                "
                      >
                        {reward.points_required.toLocaleString()} pts
                      </span>
                    </div>

                    {/* Progress */}

                    <div className="mt-7">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>

                        <span className="font-semibold text-cyan-400">
                          {rewardProgress.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="
                    h-full

                    rounded-full

                    bg-gradient-to-r
                    from-cyan-500
                    via-sky-500
                    to-blue-600

                    transition-all
                    duration-700
                  "
                          style={{
                            width: `${rewardProgress}%`,
                          }}
                        />
                      </div>

                      <p className="mt-3 text-sm">
                        {canRedeem ? (
                          <span className="font-semibold text-emerald-400">
                            🎉 Ready to redeem this reward!
                          </span>
                        ) : (
                          <span className="text-yellow-400">
                            Only <strong>{remaining.toLocaleString()}</strong>{" "}
                            more points to unlock.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Button */}

                    <Button
                      onClick={() => redeemReward(reward.id)}
                      disabled={!canRedeem}
                      className={`
                mt-8

                h-14
                w-full

                rounded-2xl

                font-bold

                transition-all

                ${
                  canRedeem
                    ? `
                      bg-gradient-to-r
                      from-cyan-500
                      via-sky-500
                      to-blue-600

                      hover:scale-[1.02]
                    `
                    : `
                      bg-[#10264A]
                      text-slate-400
                    `
                }
              `}
                    >
                      {canRedeem ? "Redeem Reward" : "Keep Collecting"}

                      <ArrowUpRight className="ml-2 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
