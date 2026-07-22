import { offlineDB } from "./db";

export async function queueTransaction(type: any, payload: any) {
  console.log("🚀 queueTransaction called:", type);

  const transaction = {
    id: crypto.randomUUID(),

    type,

    payload,

    status: "pending" as const,

    retries: 0,

    created_at: new Date().toISOString(),

    updated_at: new Date().toISOString(),
  };

  console.log("Saving transaction:", transaction);

  await offlineDB.pendingTransactions.put(transaction);

  console.log("✅ Queue size:", await offlineDB.pendingTransactions.count());

  console.log("Queue contents:", await offlineDB.pendingTransactions.toArray());
}
