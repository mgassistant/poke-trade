// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: trade, error } = await supabase
    .from("trade_offers")
    .select(`
      *,
      sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level),
      receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level),
      trade_items(*, cards(id, name, number, image_url, market_value, rarity, card_type, card_sets(name, symbol_url))),
      trade_offer_versions(*)
    `)
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (error || !trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  return NextResponse.json({ trade });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  // Get trade
  const { data: trade } = await supabase
    .from("trade_offers")
    .select("*, trade_offer_versions(version_number)")
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  const otherUserId = trade.sender_id === user.id ? trade.receiver_id : trade.sender_id;

  // ===== ACCEPT =====
  if (action === "accept") {
    if (trade.status !== "pending" && trade.status !== "countered") {
      return NextResponse.json({ error: "Trade cannot be accepted in current state" }, { status: 400 });
    }

    await supabase
      .from("trade_offers")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_accepted",
      title: "Trade Accepted! 🤝",
      message: "Your trade offer has been accepted.",
      data: { trade_id: id },
    });

    await supabase.from("activity_feed").insert({
      user_id: user.id,
      activity_type: "trade_accepted",
      related_id: id,
    });

    return NextResponse.json({ success: true, status: "accepted" });
  }

  // ===== DECLINE =====
  if (action === "decline") {
    if (trade.status === "completed" || trade.status === "cancelled") {
      return NextResponse.json({ error: "Trade is already closed" }, { status: 400 });
    }

    await supabase
      .from("trade_offers")
      .update({ status: "declined", notes: body.reason || trade.notes, updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_declined",
      title: "Trade Declined",
      message: body.reason ? `Your trade was declined: ${body.reason}` : "Your trade offer was declined.",
      data: { trade_id: id },
    });

    return NextResponse.json({ success: true, status: "declined" });
  }

  // ===== CANCEL =====
  if (action === "cancel") {
    if (trade.sender_id !== user.id) {
      return NextResponse.json({ error: "Only the sender can cancel" }, { status: 403 });
    }
    if (trade.status === "completed" || trade.status === "cancelled") {
      return NextResponse.json({ error: "Trade is already closed" }, { status: 400 });
    }

    await supabase
      .from("trade_offers")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_cancelled",
      title: "Trade Cancelled",
      message: "A trade offer was cancelled by the sender.",
      data: { trade_id: id },
    });

    return NextResponse.json({ success: true, status: "cancelled" });
  }

  // ===== COUNTER =====
  if (action === "counter") {
    if (trade.status === "completed" || trade.status === "cancelled") {
      return NextResponse.json({ error: "Trade is closed" }, { status: 400 });
    }

    const { items_offered, items_wanted, cash_amount, notes } = body;
    const nextVersion = (trade.trade_offer_versions?.length || 0) + 1;

    // Update trade status
    await supabase
      .from("trade_offers")
      .update({ status: "countered", cash_amount, notes, updated_at: new Date().toISOString() })
      .eq("id", id);

    // Remove old trade items and insert new ones
    await supabase.from("trade_items").delete().eq("trade_offer_id", id);

    if (items_offered?.length) {
      const offerItems = items_offered.map((item: { card_id: string; collection_item_id?: string }) => ({
        trade_offer_id: id,
        user_id: user.id,
        card_id: item.card_id,
        collection_item_id: item.collection_item_id || null,
      }));
      await supabase.from("trade_items").insert(offerItems);
    }

    if (items_wanted?.length) {
      const wantItems = items_wanted.map((item: { card_id: string; collection_item_id?: string }) => ({
        trade_offer_id: id,
        user_id: otherUserId,
        card_id: item.card_id,
        collection_item_id: item.collection_item_id || null,
      }));
      await supabase.from("trade_items").insert(wantItems);
    }

    // Store version
    await supabase.from("trade_offer_versions").insert({
      trade_offer_id: id,
      version_number: nextVersion,
      proposed_by: user.id,
      action: "counter",
      cash_amount,
      notes,
      items_offered: items_offered || [],
      items_wanted: items_wanted || [],
    });

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_counter",
      title: "Counter Offer Received",
      message: `Your trade has a new counter offer (v${nextVersion}).`,
      data: { trade_id: id },
    });

    return NextResponse.json({ success: true, version: nextVersion });
  }

  // ===== COMPLETE =====
  if (action === "complete") {
    if (trade.status !== "accepted") {
      return NextResponse.json({ error: "Trade must be accepted first" }, { status: 400 });
    }

    await supabase
      .from("trade_offers")
      .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);

    // Update both profiles trade counts
    for (const uid of [trade.sender_id, trade.receiver_id]) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("total_trades")
        .eq("id", uid)
        .single();
      if (prof) {
        await supabase.from("profiles")
          .update({ total_trades: (prof.total_trades || 0) + 1 })
          .eq("id", uid);
      }
    }

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_completed",
      title: "Trade Completed! ✅",
      message: "Your trade has been marked as completed.",
      data: { trade_id: id },
    });

    return NextResponse.json({ success: true, status: "completed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
