// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/orders — List orders for current user (as buyer or seller)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "buyer"; // "buyer" or "seller"
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("orders")
    .select(`
      *,
      listing:listings!orders_listing_id_fkey(
        id, title, price, condition, photos, card_id,
        card:cards!listings_card_id_fkey(id, name, number, rarity, image_url, market_value, card_sets(name))
      ),
      buyer:profiles!orders_buyer_id_fkey(id, username, display_name, avatar_url, trade_score),
      seller:profiles!orders_seller_id_fkey(id, username, display_name, avatar_url, trade_score)
    `, { count: "exact" });

  if (role === "seller") {
    query = query.eq("seller_id", user.id);
  } else {
    query = query.eq("buyer_id", user.id);
  }

  if (status) {
    query = query.eq("status", status);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data: orders, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
