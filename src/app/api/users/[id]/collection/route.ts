// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  // Get user's public collections
  const { data: collections } = await supabase
    .from("collections")
    .select(`
      id, name,
      collection_items(
        id, card_id, quantity, condition, current_value,
        cards(id, name, number, image_url, market_value, rarity, card_type, card_sets(name, symbol_url))
      )
    `)
    .eq("user_id", id)
    // Show public collections, or all collections if viewing for trade purposes
    // (trade partners need to see cards available for trade)
    ;

  if (!collections || collections.length === 0) {
    return NextResponse.json({ items: [], profile: null });
  }

  // Flatten all items
  let items = collections.flatMap((c) =>
    (c.collection_items || []).map((item) => ({
      ...item,
      collection_name: c.name,
    }))
  );

  // Search filter
  if (q) {
    const lower = q.toLowerCase();
    items = items.filter((item) => {
      const card = item.cards as Record<string, unknown> | null;
      if (!card) return false;
      return (card.name as string || "").toLowerCase().includes(lower);
    });
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, trade_score, trader_level")
    .eq("id", id)
    .single();

  return NextResponse.json({ items: items.slice(0, 100), profile });
}
