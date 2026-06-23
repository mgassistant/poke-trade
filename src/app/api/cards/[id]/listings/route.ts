import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const condition = searchParams.get("condition");
  const sort = searchParams.get("sort") || "price_low";

  let query = supabase
    .from("listings")
    .select(`
      *,
      user:profiles!listings_user_id_fkey(
        id, username, display_name, avatar_url, 
        trade_score, trader_level, verification_level,
        subscription_tier, is_verified, is_premium,
        stripe_connect_id, location, bio, total_trades,
        total_sales, created_at
      ),
      card:cards!listings_card_id_fkey(
        id, name, number, rarity, image_url, market_value,
        card_sets(name, symbol_url, logo_url)
      )
    `)
    .eq("card_id", id)
    .eq("status", "active");

  if (condition) {
    query = query.eq("condition", condition);
  }

  // Sort
  switch (sort) {
    case "price_low":
      query = query.order("price", { ascending: true });
      break;
    case "price_high":
      query = query.order("price", { ascending: false });
      break;
    case "rating":
      query = query.order("created_at", { ascending: false }); // fallback, real sort by join col not supported
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data: listings, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort by rating client-side if needed
  let sorted = listings || [];
  if (sort === "rating") {
    sorted = [...sorted].sort((a: any, b: any) =>
      (b.user?.trade_score || 0) - (a.user?.trade_score || 0)
    );
  }

  return NextResponse.json({ listings: sorted });
}
