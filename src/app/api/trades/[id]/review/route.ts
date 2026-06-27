// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateTrustScore, type TrustScoreProfile } from "@/lib/trust-score";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    rating,
    comment,
    communication_rating,
    accuracy_rating,
    shipping_rating,
    condition_rating,
    review_photos,
  } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  // Validate category ratings if provided
  const categoryFields = [communication_rating, accuracy_rating, shipping_rating, condition_rating];
  for (const val of categoryFields) {
    if (val !== undefined && val !== null && (val < 1 || val > 5)) {
      return NextResponse.json({ error: "Category ratings must be between 1 and 5" }, { status: 400 });
    }
  }

  // Get trade
  const { data: trade } = await supabase
    .from("trade_offers")
    .select("*")
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  if (trade.status !== "completed") {
    return NextResponse.json({ error: "Can only review completed trades" }, { status: 400 });
  }

  // 14-day review window
  if (trade.completed_at) {
    const completedAt = new Date(trade.completed_at).getTime();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - completedAt > fourteenDays) {
      return NextResponse.json({ error: "Review window has closed (14 days after completion)" }, { status: 400 });
    }
  }

  const revieweeId = trade.sender_id === user.id ? trade.receiver_id : trade.sender_id;

  // Check if already reviewed
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("trade_offer_id", id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "You already reviewed this trade" }, { status: 400 });
  }

  // Create review with categorical ratings
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      trade_offer_id: id,
      rating,
      comment: comment || null,
      review_type: "trade",
      communication_rating: communication_rating || null,
      accuracy_rating: accuracy_rating || null,
      shipping_rating: shipping_rating || null,
      condition_rating: condition_rating || null,
      review_photos: review_photos || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update reviewee's trade_score (avg of all reviews)
  const { data: allReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", revieweeId);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await supabase
      .from("profiles")
      .update({ trade_score: Math.round(avg * 100) / 100 })
      .eq("id", revieweeId);
  }

  // Recalculate and update the reviewed user's trust_score
  try {
    const { data: revieweeProfile } = await supabase
      .from("profiles")
      .select("created_at, verification_level, total_trades, total_sales")
      .eq("id", revieweeId)
      .single();

    if (revieweeProfile) {
      const avgRating = allReviews && allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      const { count: deliveryCount } = await supabase
        .from("trade_offers")
        .select("id", { count: "exact", head: true })
        .or(`sender_id.eq.${revieweeId},receiver_id.eq.${revieweeId}`)
        .eq("status", "completed")
        .not("tracking_number", "is", null);

      const { count: chargebackCount } = await supabase
        .from("disputes")
        .select("id", { count: "exact", head: true })
        .eq("respondent_id", revieweeId)
        .eq("resolution", "chargeback");

      const { count: lostDisputeCount } = await supabase
        .from("disputes")
        .select("id", { count: "exact", head: true })
        .eq("respondent_id", revieweeId)
        .eq("resolution", "resolved_against");

      const { count: reportCount } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("reported_id", revieweeId)
        .eq("status", "confirmed");

      const trustProfile: TrustScoreProfile = {
        created_at: revieweeProfile.created_at,
        verification_level: revieweeProfile.verification_level ?? 0,
        total_trades: revieweeProfile.total_trades ?? 0,
        total_sales: revieweeProfile.total_sales ?? 0,
        average_rating: avgRating,
        successful_deliveries: deliveryCount ?? 0,
        chargebacks: chargebackCount ?? 0,
        lost_disputes: lostDisputeCount ?? 0,
        community_reports: reportCount ?? 0,
      };

      const breakdown = calculateTrustScore(trustProfile);

      await supabase
        .from("profiles")
        .update({
          trust_score: breakdown.score,
          trust_score_updated_at: new Date().toISOString(),
        })
        .eq("id", revieweeId);
    }
  } catch (e) {
    // Trust score update is non-critical, don't fail the review
    console.error("Failed to update trust score:", e);
  }

  // Log trade event
  await supabase.from("trade_events").insert({
    trade_id: id,
    event_type: "reviewed",
    actor_id: user.id,
    details: { rating, communication_rating, accuracy_rating, shipping_rating, condition_rating },
  });

  // Notify
  await supabase.from("notifications").insert({
    user_id: revieweeId,
    notification_type: "review_received",
    title: "New Review Received ⭐",
    message: `You received a ${rating}-star review for a trade.`,
    data: { trade_id: id, review_id: review.id },
  });

  return NextResponse.json({ review });
}
