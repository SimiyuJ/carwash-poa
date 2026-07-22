import { syncInvoiceUpload } from "./syncInvoiceUpload";
import { syncQueueUpload } from "./syncQueueUpload";
import { syncSubscriptionUpload } from "./syncSubscriptionUpload";
import { syncRewardUpload } from "./syncRewardUpload";

export async function syncManager() {
  if (!navigator.onLine) return;

  console.log("🌍 Internet detected");
  console.log("🚀 Starting background sync...");

  await syncInvoiceUpload();

  await syncQueueUpload();

  await syncSubscriptionUpload();

  await syncRewardUpload();

  console.log("✅ Background sync complete");
}
