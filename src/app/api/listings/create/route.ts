// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    card_id?: string;
    title?: string;
    description?: string;
    condition?: string;
    price?: number;
    shipping_cost?: number;
    accepts_offers?: boolean;
    photos?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { card_id, title, description, condition, price, shipping_cost, accepts_offers, photos } = body;

  if (!card_id || !title || !price || price <= 0) {
    return NextResponse.json({ error: "card_id, title, and a positive price are required" }, { status: 400 });
  }

  // Verify card exists and user owns it in collection
  const { data: collectionItem } = await supabase
    .from("collection_items")
    .select("id, collections!inner(user_id)")
    .eq("card_id", card_id)
    .eq("collections.user_id", user.id)
    .limit(1)
    .single();

  if (!collectionItem) {
    return NextResponse.json({ error: "Card not found in your collection" }, { status: 400 });
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
    return NextResponse.json({ error: `Listing value exceeds your limit ($${limits.max_listing_value}).` }, { status: 403 });
  }

  const { count: activeCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (limits && (activeCount || 0) >= limits.max_listings) {
    return NextResponse.json({ error: `Listing limit reached (${limits.max_listings}).` }, { status: 429 });
  }

  // Require photos for $50+ items (front and back for $100+)
  if (price >= 100 && (!photos || photos.length < 2)) {
    return NextResponse.json({ error: "Front and back photos required for high-value listings ($100+)" }, { status: 400 });
  }
  if (price >= 50 && (!photos || photos.length < 1)) {
    return NextResponse.json({ error: "At least one photo required for listings over $50" }, { status: 400 });
  }

  const { data: card } = await supabase
    .from("cards")
    .select("market_value, name")
    .eq("id", card_id)
    .single();

  // Anti-scalper price cap: max 2x market value
  if (card?.market_value && card.market_value > 0) {
    const maxPrice = card.market_value * 2;
    if (price > maxPrice) {
      return NextResponse.json(
        { error: `Price exceeds fair market limit (max 2x market value of $${maxPrice.toFixed(2)})` },
        { status: 400 }
      );
    }
  }

  let flagged = false;
  if (card?.market_value && price < card.market_value * 0.3) {
    flagged = true;
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      card_id,
      title,
      description: description || null,
      condition: condition || "near_mint",
      price,
      shipping_cost: shipping_cost || 0,
      accepts_offers: accepts_offers ?? true,
      photos: photos || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (flagged) {
    await supabase.from("listing_flags").insert({
      listing_id: listing.id,
      flag_type: "price_too_low",
      severity: "high",
      auto_detected: true,
      details: `Listed at $${price}, market value $${card?.market_value}`,
    });
  }

  // Run fraud risk assessment
  try {
    const { calculateListingRisk } = await import("@/lib/fraud-detection");

    // Count recent listings
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    const { count: disputeCount } = await supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("initiator_id", user.id);

    const listingRisk = {
      id: listing.id,
      price,
      photos: photos || [],
      created_at: listing.created_at,
      card_market_value: card?.market_value || null,
    };

    const sellerRisk = {
      id: user.id,
      created_at: profile?.created_at || new Date().toISOString(),
      verification_level: profile?.verification_level || 0,
      trust_score: profile?.trust_score || 100,
      total_trades: profile?.total_trades || 0,
      total_sales: profile?.total_sales || 0,
      dispute_count: disputeCount || 0,
      recent_listing_count: recentCount || 0,
    };

    const riskAssessment = calculateListingRisk(listingRisk, sellerRisk);

    if (riskAssessment.level === "high") {
      await supabase.from("fraud_flags").insert({
        listing_id: listing.id,
        user_id: user.id,
        risk_score: riskAssessment.score,
        risk_level: riskAssessment.level,
        flags: riskAssessment.flags,
        status: "pending",
      });
    }
  } catch {
    // Non-critical: don't block listing creation if fraud check fails
  }

  await supabase.from("activity_feed").insert({
    user_id: user.id,
    activity_type: "listing_created",
    data: { card_name: card?.name, price },
    related_id: listing.id,
  });

  return NextResponse.json({ listing, flagged });
}
