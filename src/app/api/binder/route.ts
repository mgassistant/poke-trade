// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "date_added";
  const userId = searchParams.get("user_id"); // For shared binder viewing
  const shareCode = searchParams.get("share_code");
  const pageSize = 9; // 3x3 binder page

  let targetUserId: string | null = null;

  if (shareCode) {
    const { data: shared } = await supabase
      .from("shared_binders")
      .select("user_id, is_active")
      .eq("share_code", shareCode)
      .single();

    if (!shared || !shared.is_active) {
      return NextResponse.json({ error: "Binder not found or link expired" }, { status: 404 });
    }
    targetUserId = shared.user_id;
  } else if (userId) {
    targetUserId = userId;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    targetUserId = user.id;
  }

  // Get collection items
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("collection_items")
    .select(`
      id, card_id, quantity, condition, created_at,
      cards!inner(id, name, number, rarity, image_url, market_value, card_sets(id, name, symbol_url)),
      collections!inner(user_id)
    `, { count: "exact" })
    .eq("collections.user_id", targetUserId);

  if (sort === "value") {
    query = query.order("cards(market_value)", { ascending: false });
  } else if (sort === "rarity") {
    query = query.order("cards(rarity)", { ascending: false });
  } else if (sort === "set_order") {
    query = query.order("cards(number)", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: items, count } = await query.range(offset, offset + pageSize - 1);

  // Stats
  const { data: allItems } = await supabase
    .from("collection_items")
    .select("cards!inner(market_value, rarity, name, image_url, card_sets(name))", { count: "exact" })
    .eq("collections.user_id", targetUserId);

  let totalValue = 0;
  let rarestCard = null;
  let setCompletion: Record<string, { owned: number; name: string }> = {};

  if (allItems) {
    for (const item of allItems) {
      const card = item.cards as any;
      totalValue += Number(card?.market_value) || 0;

      const setName = card?.card_sets?.name || "Unknown";
      if (!setCompletion[setName]) {
        setCompletion[setName] = { owned: 0, name: setName };
      }
      setCompletion[setName].owned++;

      if (!rarestCard || getRarityScore(card?.rarity) > getRarityScore(rarestCard.rarity)) {
        rarestCard = {
          name: card?.name,
          rarity: card?.rarity,
          image_url: card?.image_url,
          market_value: card?.market_value,
        };
      }
    }
  }

  // Get profile for binder owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", targetUserId)
    .single();

  return NextResponse.json({
    items: items || [],
    totalCards: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
    page,
    stats: {
      totalCards: allItems?.length || 0,
      totalValue,
      rarestCard,
      setCompletion: Object.values(setCompletion).sort((a, b) => b.owned - a.owned).slice(0, 10),
    },
    owner: profile,
  });
}

function getRarityScore(rarity: string | null): number {
  const scores: Record<string, number> = {
    "Illustration Rare": 10,
    "Special Art Rare": 9,
    "Hyper Rare": 8,
    "Ultra Rare": 7,
    "Full Art": 6,
    "Rare Holo VMAX": 5,
    "Rare Holo V": 4,
    "Rare Holo": 3,
    "Rare": 2,
    "Uncommon": 1,
    "Common": 0,
  };
  return scores[rarity || ""] ?? 0;
}
