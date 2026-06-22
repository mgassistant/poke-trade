// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/want-list — Get user's want list items
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create default want list
  let { data: wantList } = await supabase
    .from("want_lists")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!wantList) {
    const { data: newList } = await supabase
      .from("want_lists")
      .insert({ user_id: user.id, name: "My Want List" })
      .select("id")
      .single();
    wantList = newList;
  }

  if (!wantList) {
    return NextResponse.json({ items: [] });
  }

  const { data: items, error } = await supabase
    .from("want_list_items")
    .select(`
      *,
      cards(id, name, number, rarity, card_type, image_url, market_value, set_id,
        card_sets(id, name, series, symbol_url)
      )
    `)
    .eq("want_list_id", wantList.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if any listings exist for wanted cards
  const cardIds = (items || []).map((i) => i.card_id);
  let matchMap: Record<string, boolean> = {};

  if (cardIds.length > 0) {
    const { data: matches } = await supabase
      .from("listings")
      .select("card_id")
      .in("card_id", cardIds)
      .eq("status", "active");

    for (const m of matches || []) {
      matchMap[m.card_id] = true;
    }
  }

  const enrichedItems = (items || []).map((item) => ({
    ...item,
    hasMatch: !!matchMap[item.card_id],
  }));

  return NextResponse.json({ items: enrichedItems, wantListId: wantList.id });
}

// POST /api/want-list — Add/remove/update want list items
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "add") {
    const { card_id, desired_condition, max_budget } = body;

    // Get or create default want list
    let { data: wantList } = await supabase
      .from("want_lists")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!wantList) {
      const { data: newList } = await supabase
        .from("want_lists")
        .insert({ user_id: user.id, name: "My Want List" })
        .select("id")
        .single();
      wantList = newList;
    }

    if (!wantList) {
      return NextResponse.json({ error: "Failed to create want list" }, { status: 500 });
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("want_list_items")
      .select("id")
      .eq("want_list_id", wantList.id)
      .eq("card_id", card_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Card already on want list" }, { status: 409 });
    }

    const { data: item, error } = await supabase
      .from("want_list_items")
      .insert({
        want_list_id: wantList.id,
        card_id,
        desired_condition: desired_condition || null,
        max_budget: max_budget || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item });
  }

  if (action === "remove") {
    const { item_id } = body;

    // Verify ownership
    const { data: item } = await supabase
      .from("want_list_items")
      .select("want_list_id, want_lists(user_id)")
      .eq("id", item_id)
      .single();

    if (!item || (item.want_lists as any)?.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("want_list_items")
      .delete()
      .eq("id", item_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "update") {
    const { item_id, desired_condition, max_budget } = body;

    const { data: item } = await supabase
      .from("want_list_items")
      .select("want_list_id, want_lists(user_id)")
      .eq("id", item_id)
      .single();

    if (!item || (item.want_lists as any)?.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (desired_condition !== undefined) updates.desired_condition = desired_condition;
    if (max_budget !== undefined) updates.max_budget = max_budget;

    const { error } = await supabase
      .from("want_list_items")
      .update(updates)
      .eq("id", item_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
