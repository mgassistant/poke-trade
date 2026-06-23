// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateListingRisk,
  calculateTradePartnerRisk,
  type ListingForRisk,
  type SellerForRisk,
} from "@/lib/fraud-detection";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, listing_id, user_id } = body;

  if (type === "listing" && listing_id) {
    // Check a specific listing
    const { data: listing } = await supabase
      .from("listings")
      .select("id, price, photos, created_at, user_id, card_id, cards(market_value)")
      .eq("id", listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const sellerData = await buildSellerRiskProfile(supabase, listing.user_id);

    const listingForRisk: ListingForRisk = {
      id: listing.id,
      price: listing.price,
      photos: listing.photos || [],
      created_at: listing.created_at,
      card_market_value: listing.cards?.market_value || null,
    };

    const assessment = calculateListingRisk(listingForRisk, sellerData);

    // Auto-flag high-risk listings
    if (assessment.level === "high") {
      await supabase.from("fraud_flags").insert({
        listing_id: listing.id,
        user_id: listing.user_id,
        risk_score: assessment.score,
        risk_level: assessment.level,
        flags: assessment.flags,
        status: "pending",
      });
    }

    return NextResponse.json({ assessment });
  }

  if (type === "user" && user_id) {
    // Check a user's risk profile
    const sellerData = await buildSellerRiskProfile(supabase, user_id);
    const assessment = calculateTradePartnerRisk(sellerData);

    return NextResponse.json({ assessment, profile: sellerData });
  }

  return NextResponse.json({ error: "Provide type ('listing' or 'user') and corresponding ID" }, { status: 400 });
}

async function buildSellerRiskProfile(supabase: any, userId: string): Promise<SellerForRisk> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, created_at, verification_level, trust_score, total_trades, total_sales")
    .eq("id", userId)
    .single();

  // Count disputes
  const { count: disputeCount } = await supabase
    .from("disputes")
    .select("id", { count: "exact", head: true })
    .eq("initiator_id", userId);

  // Count recent listings (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentListingCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo);

  return {
    id: profile?.id || userId,
    created_at: profile?.created_at || new Date().toISOString(),
    verification_level: profile?.verification_level || 0,
    trust_score: profile?.trust_score || 100,
    total_trades: profile?.total_trades || 0,
    total_sales: profile?.total_sales || 0,
    dispute_count: disputeCount || 0,
    recent_listing_count: recentListingCount || 0,
  };
}
