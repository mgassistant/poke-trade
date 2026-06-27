// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyTradeAccepted } from "@/lib/email-notifications";

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

// Locked and later statuses that block modifications
const LOCKED_STATUSES = ["locked", "shipped", "in_transit", "delivered", "completed", "awaiting_shipment"];

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
    .select("*, trade_offer_versions(version_number), trade_items(*, cards(id, market_value))")
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

    // Calculate trade value for fee calculation
    let tradeValue = trade.trade_value || 0;
    if (!tradeValue && trade.trade_items?.length) {
      tradeValue = trade.trade_items.reduce(
        (sum: number, item: { cards?: { market_value?: number } }) =>
          sum + (item.cards?.market_value || 0), 0
      );
    }

    const now = new Date();
    const autoCancelAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Lock the trade and reserve cards
    await supabase
      .from("trade_offers")
      .update({
        status: "locked",
        locked_at: now.toISOString(),
        auto_cancel_at: autoCancelAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", id);

    // Reserve all collection items involved in this trade
    if (trade.trade_items?.length) {
      const collectionItemIds = trade.trade_items
        .map((item: { collection_item_id?: string }) => item.collection_item_id)
        .filter(Boolean);

      if (collectionItemIds.length > 0) {
        await supabase
          .from("collection_items")
          .update({ reserved_for_trade_id: id })
          .in("id", collectionItemIds);
      }
    }

    // Notify both parties about lock
    for (const uid of [trade.sender_id, trade.receiver_id]) {
      await supabase.from("notifications").insert({
        user_id: uid,
        notification_type: "trade_locked",
        title: "🔒 Trade Locked",
        message: "Trade accepted and locked! Both parties must ship within 7 days. Upload your tracking number to continue.",
        data: { trade_id: id, auto_cancel_at: autoCancelAt.toISOString() },
      });
    }

    await supabase.from("activity_feed").insert({
      user_id: user.id,
      activity_type: "trade_accepted",
      related_id: id,
    });

    // Email notifications (fire-and-forget)
    const { data: senderProf } = await supabase.from("profiles").select("username, display_name, email").eq("id", trade.sender_id).single();
    const { data: receiverProf } = await supabase.from("profiles").select("username, display_name, email").eq("id", trade.receiver_id).single();
    if (senderProf?.email && receiverProf?.email) {
      notifyTradeAccepted(
        senderProf.display_name || senderProf.username || "Trader",
        receiverProf.display_name || receiverProf.username || "Trader",
        senderProf.email,
        receiverProf.email,
        tradeValue,
        id
      );
    }

    return NextResponse.json({ success: true, status: "locked", auto_cancel_at: autoCancelAt.toISOString() });
  }

  // ===== DECLINE =====
  if (action === "decline") {
    if (LOCKED_STATUSES.includes(trade.status)) {
      return NextResponse.json({ error: "Cannot decline a locked trade. Use dispute resolution instead." }, { status: 400 });
    }
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
    // Block cancel on locked trades
    if (LOCKED_STATUSES.includes(trade.status)) {
      return NextResponse.json(
        { error: "Cannot cancel a locked trade. Both parties must complete shipping or wait for auto-cancel after 7 days." },
        { status: 400 }
      );
    }

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

    // Free any reserved cards
    await supabase
      .from("collection_items")
      .update({ reserved_for_trade_id: null })
      .eq("reserved_for_trade_id", id);

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
    // Block counter on locked trades
    if (LOCKED_STATUSES.includes(trade.status)) {
      return NextResponse.json({ error: "Cannot counter a locked trade" }, { status: 400 });
    }
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
    if (trade.status !== "in_transit" && trade.status !== "accepted" && trade.status !== "locked") {
      return NextResponse.json({ error: "Trade must be in transit or accepted to complete" }, { status: 400 });
    }

    await supabase
      .from("trade_offers")
      .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);

    // Free reserved cards
    await supabase
      .from("collection_items")
      .update({ reserved_for_trade_id: null })
      .eq("reserved_for_trade_id", id);

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

    // Notify BOTH users to rate their trading partner
    for (const uid of [trade.sender_id, trade.receiver_id]) {
      await supabase.from("notifications").insert({
        user_id: uid,
        notification_type: "trade_completed",
        title: "Trade Completed! ✅",
        message: "Trade completed! Please rate your trading partner.",
        data: { trade_id: id, link: `/dashboard/trades/${id}` },
      });
    }

    return NextResponse.json({ success: true, status: "completed" });
  }

  // ===== ADMIN UNLOCK =====
  if (action === "admin_unlock") {
    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Unlock the trade (revert to accepted)
    await supabase
      .from("trade_offers")
      .update({
        status: "cancelled",
        locked_at: null,
        auto_cancel_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Free reserved cards
    await supabase
      .from("collection_items")
      .update({ reserved_for_trade_id: null })
      .eq("reserved_for_trade_id", id);

    // Notify both parties
    for (const uid of [trade.sender_id, trade.receiver_id]) {
      await supabase.from("notifications").insert({
        user_id: uid,
        notification_type: "trade_unlocked",
        title: "🔓 Trade Unlocked by Admin",
        message: "An admin has unlocked this trade. The trade has been cancelled and your cards are freed.",
        data: { trade_id: id },
      });
    }

    return NextResponse.json({ success: true, status: "cancelled" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
