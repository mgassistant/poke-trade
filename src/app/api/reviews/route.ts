// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "received";

  let query;
  if (tab === "given") {
    query = supabase
      .from("reviews")
      .select(`
        *,
        reviewee:profiles!reviews_reviewee_id_fkey(id, username, display_name, avatar_url),
        trade_offer:trade_offers(id, created_at, status)
      `)
      .eq("reviewer_id", user.id)
      .order("created_at", { ascending: false });
  } else {
    query = supabase
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, username, display_name, avatar_url),
        trade_offer:trade_offers(id, created_at, status)
      `)
      .eq("reviewee_id", user.id)
      .order("created_at", { ascending: false });
  }

  const { data: reviews, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get average rating
  const { data: allReceived } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", user.id);

  const avgRating = allReceived && allReceived.length > 0
    ? allReceived.reduce((sum, r) => sum + r.rating, 0) / allReceived.length
    : 0;

  return NextResponse.json({
    reviews,
    stats: {
      average_rating: Math.round(avgRating * 100) / 100,
      total_reviews: allReceived?.length || 0,
    },
  });
}
