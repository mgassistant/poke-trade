// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const card_id = searchParams.get("card_id");
  const price = searchParams.get("price");

  if (!card_id) {
    return NextResponse.json({ error: "card_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: card } = await supabase
    .from("cards")
    .select("id, name, market_value")
    .eq("id", card_id)
    .single();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const marketValue = Number(card.market_value) || 0;
  const maxPrice = marketValue * 2;
  const checkPrice = price ? parseFloat(price) : 0;
  const priceRatio = marketValue > 0 && checkPrice > 0 ? checkPrice / marketValue : 0;

  return NextResponse.json({
    allowed: marketValue <= 0 || checkPrice <= maxPrice,
    market_value: marketValue,
    max_price: maxPrice,
    price_ratio: Math.round(priceRatio * 100) / 100,
    card_name: card.name,
  });
}
