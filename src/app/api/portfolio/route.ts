// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all user collections
  const { data: collections } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", user.id);

  const collectionIds = (collections || []).map((c) => c.id);

  if (collectionIds.length === 0) {
    return NextResponse.json({
      totalValue: 0,
      topCards: [],
      bySet: [],
      byRarity: [],
    });
  }

  const { data: items } = await supabase
    .from("collection_items")
    .select(`
      id, quantity, current_value,
      cards(id, name, number, rarity, image_url, market_value, set_id,
        card_sets(id, name, series, symbol_url)
      )
    `)
    .in("collection_id", collectionIds);

  let totalValue = 0;
  const setMap: Record<string, { name: string; value: number; count: number }> = {};
  const rarityMap: Record<string, { value: number; count: number }> = {};

  interface CardValue {
    id: string;
    name: string;
    number: string;
    rarity: string | null;
    image_url: string | null;
    set_name: string;
    value: number;
    quantity: number;
  }

  const cardValues: CardValue[] = [];

  for (const item of items || []) {
    const card = item.cards as any;
    if (!card) continue;

    const qty = item.quantity || 1;
    const val = (item.current_value || card.market_value || 0) * qty;
    totalValue += val;

    cardValues.push({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      image_url: card.image_url,
      set_name: card.card_sets?.name || "Unknown",
      value: val,
      quantity: qty,
    });

    // By set
    const setId = card.set_id || "unknown";
    if (!setMap[setId]) {
      setMap[setId] = { name: card.card_sets?.name || "Unknown", value: 0, count: 0 };
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

  // Top 10 most valuable
  const topCards = cardValues
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // By set sorted by value
  const bySet = Object.entries(setMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  // By rarity sorted by value
  const byRarity = Object.entries(rarityMap)
    .map(([rarity, data]) => ({ rarity, ...data }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json({
    totalValue,
    topCards,
    bySet,
    byRarity,
  });
}
