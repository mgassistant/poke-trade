import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateTrustScore, type TrustScoreProfile } from "@/lib/trust-score";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("user_id");

  let userId = targetUserId;

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, created_at, verification_level, total_trades, total_sales, trust_score, trust_score_updated_at"
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch average review rating
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_id", userId);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
      : 0;

  // Fetch successful deliveries (completed trades with tracking)
  const { count: deliveryCount } = await supabase
    .from("trade_offers")
    .select("id", { count: "exact", head: true })
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "completed")
    .not("tracking_number", "is", null);

  // Fetch chargebacks / lost disputes / reports
  const { count: chargebackCount } = await supabase
    .from("disputes")
    .select("id", { count: "exact", head: true })
    .eq("respondent_id", userId)
    .eq("resolution", "chargeback");

  const { count: lostDisputeCount } = await supabase
    .from("disputes")
    .select("id", { count: "exact", head: true })
    .eq("respondent_id", userId)
    .eq("resolution", "resolved_against");

  const { count: reportCount } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reported_id", userId)
    .eq("status", "confirmed");

  const trustProfile: TrustScoreProfile = {
    created_at: profile.created_at,
    verification_level: profile.verification_level ?? 0,
    total_trades: profile.total_trades ?? 0,
    total_sales: profile.total_sales ?? 0,
    average_rating: avgRating,
    successful_deliveries: deliveryCount ?? 0,
    chargebacks: chargebackCount ?? 0,
    lost_disputes: lostDisputeCount ?? 0,
    community_reports: reportCount ?? 0,
  };

  const breakdown = calculateTrustScore(trustProfile);

  // Update cached trust score in profile
  await supabase
    .from("profiles")
    .update({
      trust_score: breakdown.score,
      trust_score_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return NextResponse.json({
    user_id: userId,
    username: profile.username,
    ...breakdown,
  });
}
