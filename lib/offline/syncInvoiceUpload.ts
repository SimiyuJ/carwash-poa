import { supabase } from "@/lib/supabase";
import { offlineDB } from "./db";

export async function syncInvoiceUpload() {
  const transactions = await offlineDB.pendingTransactions
    .where("type")
    .equals("invoice")
    .toArray();

  if (!transactions.length) return;

  console.log(`📤 Syncing ${transactions.length} invoice(s)...`);

  for (const tx of transactions) {
    try {
      const { error } = await supabase.from("invoices").insert([tx.payload]);

      if (error) throw error;

      await offlineDB.pendingTransactions.delete(tx.id);

      console.log("✅ Invoice synced:", tx.payload.invoice_number);
    } catch (err) {
      console.error("❌ Invoice sync failed", err);

      await offlineDB.pendingTransactions.update(tx.id, {
        retries: tx.retries + 1,
        updated_at: new Date().toISOString(),
      });
    }
  }
}
