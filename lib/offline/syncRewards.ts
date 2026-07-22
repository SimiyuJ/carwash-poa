import { supabase } from "@/lib/supabase";
import { offlineDB } from "@/lib/offline/db";

export async function syncRewards(branchId: string) {
  const { data, error } = await supabase
    .from("loyalty_customer_rewards")
    .select(
      `
      *,
      loyalty_rewards (*)
    `,
    )
    .eq("branch_id", branchId)
    .eq("status", "available");

  if (error) {
    console.error("Reward sync failed", error);
    return;
  }

  if (!data?.length) {
    console.log("No rewards to cache");
    return;
  }

  await offlineDB.loyaltyCustomerRewards.bulkPut(
    data.map((reward) => ({
      ...reward,
      updated_at: new Date().toISOString(),
    })),
  );

  console.log(`✅ Cached ${data.length} loyalty rewards`);
}
