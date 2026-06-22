// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/trades — Get user's trades
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("trade_offers")
    .select(`
      *,
      sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level, verification_level),
      receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level, verification_level),
      trade_items(*, cards(id, name, number, image_url, market_value, card_sets(name))),
      trade_offer_versions(*, proposed_by)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: trades, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trades });
}

// POST /api/trades — Create or action on a trade
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  // Check trade limits
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_level, trade_count_this_month, subscription_tier")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // ============ CREATE TRADE OFFER ============
  if (action === "create") {
    const { receiver_id, items_offered, items_wanted, cash_amount, notes } = body;

    if (receiver_id === user.id) {
      return NextResponse.json({ error: "Cannot trade with yourself" }, { status: 400 });
    }

    // Check if user is blocked
    const { data: blocked } = await supabase
      .from("user_blocks")
      .select("id")
      .or(`and(blocker_id.eq.${receiver_id},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${receiver_id})`)
      .limit(1);

    if (blocked && blocked.length > 0) {
      return NextResponse.json({ error: "Cannot trade with this user" }, { status: 403 });
    }

    // Check trade limits
    const { data: limits } = await supabase
      .from("trade_limits")
      .select("*")
      .eq("verification_level", profile.verification_level || "none")
      .single();

    if (limits && profile.trade_count_this_month >= limits.max_trades_per_week * 4) {
      return NextResponse.json({ error: "Monthly trade limit reached. Verify your account for higher limits." }, { status: 429 });
    }

    // Create trade offer
    const { data: trade, error: tradeError } = await supabase
      .from("trade_offers")
      .insert({
        sender_id: user.id,
        receiver_id,
        status: "pending",
        cash_amount: cash_amount || null,
        notes,
      })
      .select()
      .single();

    if (tradeError) return NextResponse.json({ error: tradeError.message }, { status: 500 });

    // Add trade items
    if (items_offered?.length) {
      const offerItems = items_offered.map((item: { card_id: string; collection_item_id?: string }) => ({
        trade_offer_id: trade.id,
        user_id: user.id,
        card_id: item.card_id,
        collection_item_id: item.collection_item_id || null,
      }));
      await supabase.from("trade_items").insert(offerItems);
    }

    // Store version 1
    await supabase.from("trade_offer_versions").insert({
      trade_offer_id: trade.id,
      version_number: 1,
      proposed_by: user.id,
      action: "initial",
      cash_amount: cash_amount || null,
      notes,
      items_offered: items_offered || [],
      items_wanted: items_wanted || [],
    });

    // Increment trade count
    await supabase
      .from("profiles")
      .update({ trade_count_this_month: (profile.trade_count_this_month || 0) + 1 })
      .eq("id", user.id);

    // Notify receiver
    await supabase.from("notifications").insert({
      user_id: receiver_id,
      notification_type: "trade_offer",
      title: "New Trade Offer",
      message: `You received a trade offer from ${profile.verification_level === "verified" ? "✓ " : ""}a trader.`,
      data: { trade_id: trade.id },
    });

    // Activity feed
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      activity_type: "trade_created",
      related_id: trade.id,
    });

    return NextResponse.json({ trade });
  }

  // ============ COUNTER OFFER ============
  if (action === "counter") {
    const { trade_id, items_offered, items_wanted, cash_amount, notes } = body;

    // Get current trade
    const { data: trade } = await supabase
      .from("trade_offers")
      .select("*, trade_offer_versions(version_number)")
      .eq("id", trade_id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single();

    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    if (trade.status === "completed" || trade.status === "cancelled") {
      return NextResponse.json({ error: "Trade is closed" }, { status: 400 });
    }

    const nextVersion = (trade.trade_offer_versions?.length || 0) + 1;

    // Update trade
    await supabase
      .from("trade_offers")
      .update({ status: "countered", cash_amount, notes, updated_at: new Date().toISOString() })
      .eq("id", trade_id);

    // Store version
    await supabase.from("trade_offer_versions").insert({
      trade_offer_id: trade_id,
      version_number: nextVersion,
      proposed_by: user.id,
      action: "counter",
      cash_amount,
      notes,
      items_offered: items_offered || [],
      items_wanted: items_wanted || [],
    });

    // Notify other party
    const otherUserId = trade.sender_id === user.id ? trade.receiver_id : trade.sender_id;
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_counter",
      title: "Counter Offer Received",
      message: `Your trade has a new counter offer (Version ${nextVersion}).`,
      data: { trade_id },
    });

    return NextResponse.json({ success: true, version: nextVersion });
  }

  // ============ ACCEPT ============
  if (action === "accept") {
    const { trade_id } = body;

    const { data: trade } = await supabase
      .from("trade_offers")
      .select("*")
      .eq("id", trade_id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single();

    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    // Update status to agreed
    await supabase
      .from("trade_offers")
      .update({ status: "agreed", updated_at: new Date().toISOString() })
      .eq("id", trade_id);

    // Create trade contract
    await supabase.from("trade_contracts").insert({
      trade_offer_id: trade_id,
      party_a: trade.sender_id,
      party_b: trade.receiver_id,
      items_a_sends: [],
      items_b_sends: [],
      cash_amount: trade.cash_amount,
      cash_direction: trade.cash_amount ? "a_to_b" : null,
      agreed_at: new Date().toISOString(),
    });

    // Create shipment records for both parties
    await supabase.from("trade_shipments").insert([
      { trade_offer_id: trade_id, shipper_id: trade.sender_id, receiver_id: trade.receiver_id },
      { trade_offer_id: trade_id, shipper_id: trade.receiver_id, receiver_id: trade.sender_id },
    ]);

    // Check if free user needs to pay trade fee
    if (profile.subscription_tier === "free") {
      const freeTradesUsed = profile.trade_count_this_month || 0;
      if (freeTradesUsed > 10) {
        // Create trade fee record
        await supabase.from("trade_fees").insert({
          trade_offer_id: trade_id,
          user_id: user.id,
          fee_type: "platform_trade_fee",
          amount: 1.25, // $1.25 per side
          status: "pending",
        });
      }
    }

    // Notify
    const otherUserId = trade.sender_id === user.id ? trade.receiver_id : trade.sender_id;
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_accepted",
      title: "Trade Accepted! 🤝",
      message: "Your trade has been accepted. Time to ship!",
      data: { trade_id },
    });

    return NextResponse.json({ success: true, status: "agreed" });
  }

  // ============ DECLINE ============
  if (action === "decline") {
    const { trade_id, reason } = body;

    await supabase
      .from("trade_offers")
      .update({ status: "declined", notes: reason, updated_at: new Date().toISOString() })
      .eq("id", trade_id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    return NextResponse.json({ success: true, status: "declined" });
  }

  // ============ SHIP ============
  if (action === "ship") {
    const { trade_id, tracking_number, carrier } = body;

    await supabase
      .from("trade_shipments")
      .update({
        tracking_number,
        carrier,
        status: "shipped",
        shipped_at: new Date().toISOString(),
      })
      .eq("trade_offer_id", trade_id)
      .eq("shipper_id", user.id);

    // Update trade status
    await supabase
      .from("trade_offers")
      .update({ status: "in_transit", updated_at: new Date().toISOString() })
      .eq("id", trade_id);

    return NextResponse.json({ success: true });
  }

  // ============ CONFIRM RECEIPT ============
  if (action === "confirm_receipt") {
    const { trade_id } = body;

    await supabase
      .from("trade_shipments")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("trade_offer_id", trade_id)
      .eq("receiver_id", user.id);

    // Check if both sides confirmed
    const { data: shipments } = await supabase
      .from("trade_shipments")
      .select("status")
      .eq("trade_offer_id", trade_id);

    const allConfirmed = shipments?.every((s) => s.status === "confirmed");

    if (allConfirmed) {
      await supabase
        .from("trade_offers")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", trade_id);
    }

    return NextResponse.json({ success: true, completed: allConfirmed });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
