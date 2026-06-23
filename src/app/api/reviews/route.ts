// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateReputation } from "@/lib/reputation";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "received";
  const userId = searchParams.get("user_id") || user.id;
  const filter = searchParams.get("filter"); // 'all', 'trade', 'sale', '5-star', '1-star'

  let query;
  if (tab === "given") {
    query = supabase
      .from("reviews")
      .select(`
        *,
        reviewee:profiles!reviews_reviewee_id_fkey(id, username, display_name, avatar_url),
        trade_offer:trade_offers(id, created_at, status)
      `)
      .eq("reviewer_id", userId)
      .order("created_at", { ascending: false });
  } else {
    query = supabase
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, username, display_name, avatar_url),
        trade_offer:trade_offers(id, created_at, status)
      `)
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });
  }

  // Apply filters
  if (filter === "trade") {
    query = query.eq("review_type", "trade");
  } else if (filter === "sale") {
    query = query.eq("review_type", "sale");
  } else if (filter === "5-star") {
    query = query.eq("rating", 5);
  } else if (filter === "1-star") {
    query = query.eq("rating", 1);
  }

  const { data: reviews, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get all received reviews for reputation calculation
  const { data: allReceived } = await supabase
    .from("reviews")
    .select("rating, communication_rating, accuracy_rating, shipping_rating, condition_rating, review_type")
    .eq("reviewee_id", userId);

  const reputation = calculateReputation(allReceived || []);

  return NextResponse.json({
    reviews,
    stats: {
      average_rating: reputation.overall,
      total_reviews: reputation.totalReviews,
      trade_reviews: reputation.tradeReviews,
      sale_reviews: reputation.saleReviews,
    },
    reputation,
  });
}

// POST: Seller response to a review
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { review_id, response } = body;

  if (!review_id || !response) {
    return NextResponse.json({ error: "review_id and response are required" }, { status: 400 });
  }

  if (response.length > 500) {
    return NextResponse.json({ error: "Response must be 500 characters or less" }, { status: 400 });
  }

  // Verify user is the reviewee (seller)
  const { data: review } = await supabase
    .from("reviews")
    .select("id, reviewee_id, seller_response")
    .eq("id", review_id)
    .single();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.reviewee_id !== user.id) {
    return NextResponse.json({ error: "Only the reviewed party can respond" }, { status: 403 });
  }
  if (review.seller_response) {
    return NextResponse.json({ error: "You have already responded to this review" }, { status: 400 });
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      seller_response: response,
      seller_response_at: new Date().toISOString(),
    })
    .eq("id", review_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
