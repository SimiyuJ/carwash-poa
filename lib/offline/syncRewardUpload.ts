import { supabase } from "@/lib/supabase";
import { offlineDB } from "./db";

export async function syncRewardUpload() {
  const transactions = await offlineDB.pendingTransactions
    .where("type")
    .equals("reward")
    .toArray();

  if (!transactions.length) return;

  console.log(`📤 Syncing ${transactions.length} reward(s)...`);

  for (const tx of transactions) {
    try {
      const { error } = await supabase.rpc("redeem_loyalty_reward", {
        p_customer_id: tx.payload.customer_id,
        p_reward_id: tx.payload.reward_id,
      });

      if (error) throw error;

      await offlineDB.pendingTransactions.delete(tx.id);

      console.log("✅ Reward redeemed");
    } catch (err) {
      console.error("❌ Reward sync failed", err);

      await offlineDB.pendingTransactions.update(tx.id, {
        retries: tx.retries + 1,
        updated_at: new Date().toISOString(),
      });
    }
  }
}
