// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/listings — Browse marketplace or get user's listings
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const mine = searchParams.get("mine") === "true";
  const search = searchParams.get("search");
  const condition = searchParams.get("condition");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const sortBy = searchParams.get("sort") || "created_at";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select(`
      *,
      user:profiles!listings_user_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level, verification_level),
      card:cards!listings_card_id_fkey(id, name, number, rarity, image_url, market_value, card_sets(name, symbol_url))
    `, { count: "exact" });

  if (mine) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    query = query.eq("user_id", user.id);
  } else {
    query = query.eq("status", "active");
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }
  if (condition) {
    query = query.eq("condition", condition);
  }
  if (minPrice) {
    query = query.gte("price", parseFloat(minPrice));
  }
  if (maxPrice) {
    query = query.lte("price", parseFloat(maxPrice));
  }

  // Sort
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    created_at: { column: "created_at", ascending: false },
    price_low: { column: "price", ascending: true },
    price_high: { column: "price", ascending: false },
  };
  const sort = sortMap[sortBy] || sortMap.created_at;
  query = query.order(sort.column, { ascending: sort.ascending });

  query = query.range(offset, offset + limit - 1);

  const { data: listings, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    listings,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

// POST /api/listings — Create a listing
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    card_id, title, description, condition, price,
    shipping_cost, accepts_offers, open_to_trades,
    is_graded, grading_company, grade, photos
  } = body;

  // Validate required fields
  if (!card_id || !title || !price) {
    return NextResponse.json({ error: "card_id, title, and price are required" }, { status: 400 });
  }

  if (price <= 0) {
    return NextResponse.json({ error: "Price must be positive" }, { status: 400 });
  }

  // Check listing limits
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_level, subscription_tier")
    .eq("id", user.id)
    .single();

  const { data: limits } = await supabase
    .from("trade_limits")
    .select("max_listings, max_listing_value, can_sell")
    .eq("verification_level", profile?.verification_level || "none")
    .single();

  if (limits && !limits.can_sell) {
    return NextResponse.json({ error: "Phone verification required to sell. Go to Settings → Verification." }, { status: 403 });
  }

  if (limits && price > limits.max_listing_value) {
    return NextResponse.json({ error: `Listing value exceeds your limit ($${limits.max_listing_value}). Verify your identity for higher limits.` }, { status: 403 });
  }

  // Count existing active listings
  const { count: activeCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (limits && (activeCount || 0) >= limits.max_listings) {
    return NextResponse.json({ error: `Listing limit reached (${limits.max_listings}). Upgrade your plan or verify your account.` }, { status: 429 });
  }

  // Check for suspicious pricing
  const { data: card } = await supabase
    .from("cards")
    .select("market_value, name")
    .eq("id", card_id)
    .single();

  let flagged = false;
  if (card?.market_value && price < card.market_value * 0.3) {
    // Auto-flag listing as suspiciously low
    flagged = true;
  }

  // Require photos for items over $50
  if (price >= 50 && (!photos || photos.length < 2)) {
    return NextResponse.json({ error: "Front and back photos required for listings over $50" }, { status: 400 });
  }

  // Create listing
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      card_id,
      title,
      description,
      condition: condition || "near_mint",
      price,
      shipping_cost: shipping_cost || 0,
      accepts_offers: accepts_offers ?? true,
      open_to_trades: open_to_trades ?? false,
      is_graded: is_graded || false,
      grading_company,
      grade,
      photos: photos || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flag if suspicious
  if (flagged) {
    await supabase.from("listing_flags").insert({
      listing_id: listing.id,
      flag_type: "price_too_low",
      severity: "high",
      auto_detected: true,
      details: `Listed at $${price}, market value $${card?.market_value}`,
    });
  }

  // Activity feed
  await supabase.from("activity_feed").insert({
    user_id: user.id,
    activity_type: "listing_created",
    data: { card_name: card?.name, price },
    related_id: listing.id,
  });

  return NextResponse.json({ listing, flagged });
}
