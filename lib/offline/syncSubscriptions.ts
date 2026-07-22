import { supabase } from "@/lib/supabase";
import { offlineDB } from "@/lib/offline/db";

export async function syncSubscriptions(carwashId: string, branchId: string) {
  const { data, error } = await supabase
    .from("subscription_members")
    .select("*")
    .eq("carwash_id", carwashId)
    .eq("branch_id", branchId)
    .eq("status", "active");

  if (error) {
    console.error("Subscription sync failed", error);
    return;
  }

  if (!data?.length) return;

  await offlineDB.subscriptions.bulkPut(
    data.map((sub) => ({
      ...sub,
      updated_at: new Date().toISOString(),
    })),
  );

  console.log(`✅ Cached ${data.length} subscriptions`);
}
