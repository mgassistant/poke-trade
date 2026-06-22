// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

// GET /api/collection — Get user's collections with items
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: collections, error } = await supabase
    .from("collections")
    .select(`
      *,
      collection_items(
        *,
        cards(id, name, number, rarity, card_type, image_url, market_value,
          card_sets(id, name, series, symbol_url)
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate totals
  const stats = {
    totalCards: 0,
    totalValue: 0,
    totalGraded: 0,
    totalForTrade: 0,
    totalForSale: 0,
  };

  for (const col of (collections || []) as Record<string, unknown>[]) {
    for (const item of ((col.collection_items || []) as Record<string, unknown>[])) {
      const card = item.cards as Record<string, unknown> | null;
      stats.totalCards += (item.quantity as number) || 1;
      stats.totalValue += ((item.current_value as number) || (card?.market_value as number) || 0) * ((item.quantity as number) || 1);
      if (item.is_graded) stats.totalGraded++;
      if (item.for_trade) stats.totalForTrade++;
      if (item.for_sale) stats.totalForSale++;
    }
  }

  return NextResponse.json({ collections, stats });
}

// POST /api/collection — Create a new collection or add item
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "create_collection") {
    const { name, description, is_public } = body;

    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name: name || "My Collection",
        description,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ collection: data });
  }

  if (action === "add_item") {
    const {
      collection_id, card_id, quantity, condition,
      purchase_price, purchase_date, is_graded,
      grading_company, grade, notes, for_trade, for_sale
    } = body;

    // Verify collection belongs to user
    const { data: collection } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collection_id)
      .eq("user_id", user.id)
      .single();

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Get current market value from card
    const { data: card } = await supabase
      .from("cards")
      .select("market_value")
      .eq("id", card_id)
      .single();

    const { data: item, error } = await supabase
      .from("collection_items")
      .insert({
        collection_id,
        card_id,
        quantity: quantity || 1,
        condition: condition || "near_mint",
        purchase_price,
        purchase_date,
        current_value: card?.market_value,
        is_graded: is_graded || false,
        grading_company,
        grade,
        notes,
        for_trade: for_trade || false,
        for_sale: for_sale || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log activity
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      activity_type: "collection_add",
      data: { card_id, collection_id },
      related_id: item.id,
    });

    return NextResponse.json({ item });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
