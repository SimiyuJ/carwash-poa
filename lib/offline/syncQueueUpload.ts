import { supabase } from "@/lib/supabase";
import { offlineDB } from "./db";

export async function syncQueueUpload() {
  const transactions = await offlineDB.pendingTransactions
    .where("type")
    .equals("queue")
    .toArray();

  if (!transactions.length) return;

  console.log(`📤 Syncing ${transactions.length} queue job(s)...`);

  for (const tx of transactions) {
    try {
      const { error } = await supabase
        .from("queue_vehicles")
        .insert([tx.payload]);

      if (error) throw error;

      await offlineDB.pendingTransactions.delete(tx.id);

      console.log("✅ Queue synced:", tx.payload.ticket);
    } catch (err) {
      console.error("❌ Queue sync failed", err);

      await offlineDB.pendingTransactions.update(tx.id, {
        retries: tx.retries + 1,
        updated_at: new Date().toISOString(),
      });
    }
  }
}
