import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  // Get seller profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id, username, display_name, avatar_url, bio, location,
      trade_score, trader_level, total_trades, total_sales,
      is_verified, is_premium, subscription_tier, created_at
    `)
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  // Get active listings
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      *,
      card:cards!listings_card_id_fkey(
        id, name, number, rarity, image_url, market_value,
        card_sets(name, symbol_url)
      )
    `)
    .eq("user_id", profile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  // Get reviews received
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewed_user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    profile,
    listings: listings || [],
    reviews: reviews || [],
    stats: {
      total_listings: listings?.length || 0,
      total_trades: profile.total_trades,
      total_sales: profile.total_sales,
      member_since: profile.created_at,
    },
  });
}
