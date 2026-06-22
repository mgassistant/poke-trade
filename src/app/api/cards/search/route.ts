// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/cards/search?q=pikachu&limit=20
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const set = searchParams.get("set") || "";
  const rarity = searchParams.get("rarity") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!q && !set) {
    return NextResponse.json({ cards: [] });
  }

  let query = supabase
    .from("cards")
    .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
    .limit(limit);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (set) {
    query = query.eq("set_id", set);
  }
  if (rarity && rarity !== "All") {
    query = query.eq("rarity", rarity);
  }

  query = query.order("name", { ascending: true });

  const { data: cards, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cards: cards || [] });
}
