import { supabase } from "@/lib/supabase";
import { offlineDB } from "./db";

export async function syncSubscriptionUpload() {
  const transactions = await offlineDB.pendingTransactions
    .where("type")
    .equals("subscription")
    .toArray();

  if (!transactions.length) return;

  console.log(`📤 Syncing ${transactions.length} subscription(s)...`);

  for (const tx of transactions) {
    try {
      const { error } = await supabase
        .from("subscription_members")
        .update({
          usage: tx.payload.usage,
        })
        .eq("id", tx.payload.subscription_id);

      if (error) throw error;

      await offlineDB.pendingTransactions.delete(tx.id);

      console.log("✅ Subscription updated");
    } catch (err) {
      console.error("❌ Subscription sync failed", err);

      await offlineDB.pendingTransactions.update(tx.id, {
        retries: tx.retries + 1,
        updated_at: new Date().toISOString(),
      });
    }
  }
}
