// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/cards/scan — Accept card name/set hints, return fuzzy matches
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, set_name, number: cardNumber } = body;

  if (!name || typeof name !== "string" || name.length < 2) {
    return NextResponse.json({ error: "Card name is required (min 2 chars)" }, { status: 400 });
  }

  // Split name into words for multi-word fuzzy matching
  const words = name.trim().split(/\s+/).filter(Boolean);

  let query = supabase
    .from("cards")
    .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
    .limit(10);

  // Primary: match all words (AND)
  for (const word of words) {
    query = query.ilike("name", `%${word}%`);
  }

  // Filter by set if provided
  if (set_name && typeof set_name === "string") {
    // Sub-query on set name
    const { data: sets } = await supabase
      .from("card_sets")
      .select("id")
      .ilike("name", `%${set_name}%`)
      .limit(5);
    if (sets && sets.length > 0) {
      query = query.in("set_id", sets.map((s) => s.id));
    }
  }

  // Filter by card number if provided
  if (cardNumber && typeof cardNumber === "string") {
    query = query.eq("number", cardNumber);
  }

  query = query.order("market_value", { ascending: false, nullsFirst: false });

  const { data: cards, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no results with AND matching, try OR (broader search)
  if (!cards || cards.length === 0) {
    const fallbackQuery = supabase
      .from("cards")
      .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
      .ilike("name", `%${words[0]}%`)
      .order("market_value", { ascending: false, nullsFirst: false })
      .limit(10);

    const { data: fallbackCards } = await fallbackQuery;
    return NextResponse.json({ cards: fallbackCards || [], fuzzy: true });
  }

  return NextResponse.json({ cards, fuzzy: false });
}
