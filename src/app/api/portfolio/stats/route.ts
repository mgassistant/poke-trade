// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/portfolio/stats — Full portfolio stats + breakdown
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's collections
  const { data: collections } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", user.id);

  const collectionIds = (collections || []).map((c) => c.id);

  if (collectionIds.length === 0) {
    return NextResponse.json({
      totalValue: 0,
      totalCards: 0,
      gradedCards: 0,
      forTradeCards: 0,
      valueBySet: [],
      valueByRarity: [],
      topCards: [],
      recentCards: [],
      change7d: null,
    });
  }

  // Get all collection items with card data
  const { data: items } = await supabase
    .from("collection_items")
    .select(`
      id, quantity, current_value, is_graded, for_trade, created_at,
      cards(id, name, number, rarity, image_url, market_value, set_id,
        card_sets(id, name, series, symbol_url)
      )
    `)
    .in("collection_id", collectionIds)
    .order("created_at", { ascending: false });

  let totalValue = 0;
  let totalCards = 0;
  let gradedCards = 0;
  let forTradeCards = 0;

  const setMap: Record<string, { id: string; name: string; value: number; count: number }> = {};
  const rarityMap: Record<string, { value: number; count: number }> = {};

  interface CardEntry {
    id: string;
    name: string;
    number: string;
    rarity: string | null;
    image_url: string | null;
    set_name: string;
    value: number;
    quantity: number;
    created_at: string;
  }

  const allCards: CardEntry[] = [];

  for (const item of items || []) {
    const card = item.cards as any;
    if (!card) continue;

    const qty = item.quantity || 1;
    const val = (item.current_value || card.market_value || 0) * qty;

    totalValue += val;
    totalCards += qty;
    if (item.is_graded) gradedCards++;
    if (item.for_trade) forTradeCards++;

    allCards.push({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      image_url: card.image_url,
      set_name: card.card_sets?.name || "Unknown",
      value: val,
      quantity: qty,
      created_at: item.created_at,
    });

    // By set
    const setId = card.set_id || "unknown";
    if (!setMap[setId]) {
      setMap[setId] = { id: setId, name: card.card_sets?.name || "Unknown", value: 0, count: 0 };
    }
    setMap[setId].value += val;
    setMap[setId].count += qty;

    // By rarity
    const rarity = card.rarity || "Unknown";
    if (!rarityMap[rarity]) {
      rarityMap[rarity] = { value: 0, count: 0 };
    }
    rarityMap[rarity].value += val;
    rarityMap[rarity].count += qty;
  }

  // Top 10 by value
  const topCards = [...allCards]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Recent 10
  const recentCards = allCards.slice(0, 10);

  // By set top 10
  const valueBySet = Object.values(setMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // By rarity
  const valueByRarity = Object.entries(rarityMap)
    .map(([rarity, data]) => ({ rarity, ...data }))
    .sort((a, b) => b.value - a.value);

  // 7-day change — try portfolio_snapshots table
  let change7d: number | null = null;
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: snapshot } = await supabase
      .from("portfolio_snapshots")
      .select("total_value")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (snapshot) {
      change7d = totalValue - (snapshot.total_value || 0);
    }
  } catch {
    // Table may not exist yet — that's fine
  }

  return NextResponse.json({
    totalValue,
    totalCards,
    gradedCards,
    forTradeCards,
    valueBySet,
    valueByRarity,
    topCards,
    recentCards,
    change7d,
  });
}
