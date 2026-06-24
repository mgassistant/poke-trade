// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parallel: fetch collections + trades + offers + activity at once
  const [collectionsRes, activeTradesRes, pendingOffersRes, activityRes] = await Promise.all([
    supabase.from("collections").select("id").eq("user_id", user.id),
    supabase.from("trade_offers").select("id", { count: "exact", head: true })
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .in("status", ["pending", "accepted"]),
    supabase.from("offers").select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("activity_feed")
      .select("id, activity_type, data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const collectionIds = (collectionsRes.data || []).map((c) => c.id);
  let totalCards = 0;
  let totalValue = 0;

  if (collectionIds.length > 0) {
    const { data: items } = await supabase
      .from("collection_items")
      .select("quantity, current_value, cards(market_value)")
      .in("collection_id", collectionIds);

    for (const item of items || []) {
      const qty = item.quantity || 1;
      const val = item.current_value || (item.cards as any)?.market_value || 0;
      totalCards += qty;
      totalValue += val * qty;
    }
  }

  const activeTrades = activeTradesRes.count;
  const pendingOffers = pendingOffersRes.count;
  const activity = activityRes.data;

  return NextResponse.json({
    stats: {
      collectionValue: totalValue,
      totalCards,
      activeTrades: activeTrades || 0,
      pendingOffers: pendingOffers || 0,
    },
    activity: activity || [],
  });
}
