// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch collection items
  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", user.id)
    .order("estimated_value", { ascending: false });

  const items = collection ?? [];

  // Calculate stats
  const totalCards = items.length;
  const totalEstimatedValue = items.reduce(
    (sum, item) => sum + (parseFloat(item.estimated_value) || parseFloat(item.price) || 0),
    0
  );
  const gradedCards = items.filter(
    (item) => item.grading_company || item.grade || item.is_graded
  );
  const ungradedCards = items.filter(
    (item) => !item.grading_company && !item.grade && !item.is_graded
  );

  // Top 10 most valuable
  const top10 = items.slice(0, 10).map((item) => ({
    name: item.card_name || item.name || "Unknown Card",
    set: item.set_name || item.card_set || "",
    condition: item.condition || "Unknown",
    graded: !!(item.grading_company || item.grade || item.is_graded),
    grading_company: item.grading_company || null,
    grade: item.grade || null,
    estimated_value: parseFloat(item.estimated_value) || parseFloat(item.price) || 0,
  }));

  // Condition breakdown
  const conditionBreakdown: Record<string, number> = {};
  items.forEach((item) => {
    const cond = item.condition || "Unknown";
    conditionBreakdown[cond] = (conditionBreakdown[cond] || 0) + 1;
  });

  // Want list info
  const { data: wantList } = await supabase
    .from("want_lists")
    .select("*")
    .eq("user_id", user.id);

  const report = {
    generated_at: new Date().toISOString(),
    user_id: user.id,
    summary: {
      total_cards: totalCards,
      total_estimated_value: Math.round(totalEstimatedValue * 100) / 100,
      graded_cards: gradedCards.length,
      ungraded_cards: ungradedCards.length,
      want_list_items: wantList?.length ?? 0,
    },
    top_10_most_valuable: top10,
    condition_breakdown: conditionBreakdown,
    disclaimer:
      "This report is generated from user-entered data on Poké-Trade and is provided for informational purposes only. Values are estimates based on market data and may not reflect actual insurance value. A licensed insurance professional should perform an independent appraisal for coverage purposes. Poké-Trade is not an insurance company.",
  };

  return NextResponse.json({ report });
}
