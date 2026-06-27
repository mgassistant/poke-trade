// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/collection/sets — Set completion data with user's collected counts
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all card sets
  const { data: cardSets, error: setsError } = await supabase
    .from("card_sets")
    .select("id, name, series, symbol_url, logo_url, total_cards, release_date")
    .order("release_date", { ascending: false });

  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 });
  }

  // Get user's collection IDs
  const { data: collections } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", user.id);

  const collectionIds = (collections || []).map((c) => c.id);

  // Get user's collected cards with their set_id and value
  let collectedBySet: Record<string, { count: number; value: number; cardIds: Set<string> }> = {};

  if (collectionIds.length > 0) {
    const { data: items } = await supabase
      .from("collection_items")
      .select(`
        id, quantity, current_value,
        cards(id, set_id, market_value)
      `)
      .in("collection_id", collectionIds);

    for (const item of items || []) {
      const card = item.cards as any;
      if (!card?.set_id) continue;
      
      if (!collectedBySet[card.set_id]) {
        collectedBySet[card.set_id] = { count: 0, value: 0, cardIds: new Set() };
      }
      
      // Count unique cards (not duplicates)
      if (!collectedBySet[card.set_id].cardIds.has(card.id)) {
        collectedBySet[card.set_id].cardIds.add(card.id);
        collectedBySet[card.set_id].count++;
      }
      
      const val = (item.current_value || card.market_value || 0) * (item.quantity || 1);
      collectedBySet[card.set_id].value += val;
    }
  }

  // Merge sets with collection data
  const sets = (cardSets || []).map((set) => {
    const collected = collectedBySet[set.id];
    return {
      id: set.id,
      name: set.name,
      series: set.series,
      symbol_url: set.symbol_url,
      logo_url: set.logo_url,
      total_cards: set.total_cards || 0,
      release_date: set.release_date,
      collected_count: collected?.count || 0,
      collected_value: collected?.value || 0,
    };
  });

  return NextResponse.json({ sets });
}
