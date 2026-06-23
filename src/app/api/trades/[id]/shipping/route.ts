// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateTrackingNumber } from "@/lib/trade-fees";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify user is part of this trade
  const { data: trade } = await supabase
    .from("trade_offers")
    .select("id, sender_id, receiver_id, status, shipping_method, verification_fee_paid, locked_at, auto_cancel_at, fee_amount, fee_per_party, protection_amount, protection_paid, trade_value")
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  // Get shipping details
  const { data: shipping } = await supabase
    .from("trade_shipping_details")
    .select("*")
    .eq("trade_offer_id", id)
    .single();

  return NextResponse.json({ trade, shipping });
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
    .select("id, sender_id, receiver_id, status, shipping_method, locked_at, auto_cancel_at")
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  // Allow shipping actions on locked, accepted, in_transit, awaiting_shipment
  const allowedStatuses = ["locked", "accepted", "in_transit", "awaiting_shipment", "shipped"];
  if (!allowedStatuses.includes(trade.status)) {
    return NextResponse.json({ error: "Trade must be locked/accepted before shipping" }, { status: 400 });
  }

  const isSender = trade.sender_id === user.id;
  const otherUserId = isSender ? trade.receiver_id : trade.sender_id;

  // Ensure shipping details row exists
  const { data: existing } = await supabase
    .from("trade_shipping_details")
    .select("id")
    .eq("trade_offer_id", id)
    .single();

  if (!existing) {
    await supabase.from("trade_shipping_details").insert({ trade_offer_id: id });
  }

  // ===== UPLOAD PHOTOS =====
  if (action === "upload_photos") {
    const { photos } = body;
    if (!photos?.length) return NextResponse.json({ error: "No photos provided" }, { status: 400 });

    const field = isSender ? "sender_photos" : "receiver_photos";
    await supabase
      .from("trade_shipping_details")
      .update({ [field]: photos, updated_at: new Date().toISOString() })
      .eq("trade_offer_id", id);

    return NextResponse.json({ success: true });
  }

  // ===== ADD TRACKING =====
  if (action === "add_tracking") {
    const { tracking_number, carrier } = body;
    if (!tracking_number) return NextResponse.json({ error: "Tracking number required" }, { status: 400 });

    // Validate tracking number format
    const validation = validateTrackingNumber(tracking_number, carrier || "other");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const trackingField = isSender ? "sender_tracking" : "receiver_tracking";
    const carrierField = isSender ? "sender_carrier" : "receiver_carrier";
    const shippedField = isSender ? "sender_shipped_at" : "receiver_shipped_at";

    await supabase
      .from("trade_shipping_details")
      .update({
        [trackingField]: tracking_number,
        [carrierField]: carrier || "other",
        [shippedField]: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("trade_offer_id", id);

    // Check if BOTH parties have now submitted tracking
    const { data: details } = await supabase
      .from("trade_shipping_details")
      .select("sender_tracking, receiver_tracking")
      .eq("trade_offer_id", id)
      .single();

    // After our update, check if both have tracking
    const senderHasTracking = isSender ? true : !!details?.sender_tracking;
    const receiverHasTracking = isSender ? !!details?.receiver_tracking : true;

    if (senderHasTracking && receiverHasTracking) {
      // Both parties shipped — transition to in_transit
      await supabase
        .from("trade_offers")
        .update({ status: "in_transit", updated_at: new Date().toISOString() })
        .eq("id", id);

      // Notify both
      for (const uid of [trade.sender_id, trade.receiver_id]) {
        await supabase.from("notifications").insert({
          user_id: uid,
          notification_type: "trade_in_transit",
          title: "📦 Both Packages In Transit!",
          message: "Both parties have shipped their cards. Packages are on their way!",
          data: { trade_id: id },
        });
      }
    } else {
      // Only one party shipped — notify the other
      await supabase.from("notifications").insert({
        user_id: otherUserId,
        notification_type: "trade_shipped",
        title: "Cards Shipped! 📦",
        message: `Your trade partner has shipped their cards. Tracking: ${tracking_number}`,
        data: { trade_id: id },
      });
    }

    return NextResponse.json({ success: true, both_shipped: senderHasTracking && receiverHasTracking });
  }

  // ===== CONFIRM RECEIPT =====
  if (action === "confirm_receipt") {
    const receivedField = isSender ? "sender_received_at" : "receiver_received_at";
    const confirmedField = isSender ? "sender_confirmed" : "receiver_confirmed";

    await supabase
      .from("trade_shipping_details")
      .update({
        [receivedField]: new Date().toISOString(),
        [confirmedField]: true,
        updated_at: new Date().toISOString(),
      })
      .eq("trade_offer_id", id);

    // Check if both confirmed
    const { data: details } = await supabase
      .from("trade_shipping_details")
      .select("sender_confirmed, receiver_confirmed")
      .eq("trade_offer_id", id)
      .single();

    const senderConfirmed = isSender ? true : !!details?.sender_confirmed;
    const receiverConfirmed = isSender ? !!details?.receiver_confirmed : true;

    if (senderConfirmed && receiverConfirmed) {
      // Both confirmed — complete the trade
      await supabase
        .from("trade_offers")
        .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);

      // Free reserved cards
      await supabase
        .from("collection_items")
        .update({ reserved_for_trade_id: null })
        .eq("reserved_for_trade_id", id);

      // Update trade counts
      for (const uid of [trade.sender_id, trade.receiver_id]) {
        const { data: prof } = await supabase.from("profiles").select("total_trades").eq("id", uid).single();
        if (prof) {
          await supabase.from("profiles").update({ total_trades: (prof.total_trades || 0) + 1 }).eq("id", uid);
        }
      }

      // Notify both
      for (const uid of [trade.sender_id, trade.receiver_id]) {
        await supabase.from("notifications").insert({
          user_id: uid,
          notification_type: "trade_completed",
          title: "Trade Complete! ✅",
          message: "Both parties have confirmed receipt. Trade is complete!",
          data: { trade_id: id },
        });
      }
    } else {
      // Notify other party
      await supabase.from("notifications").insert({
        user_id: otherUserId,
        notification_type: "trade_receipt_confirmed",
        title: "Receipt Confirmed 📬",
        message: "Your trade partner confirmed receiving the cards.",
        data: { trade_id: id },
      });
    }

    return NextResponse.json({ success: true });
  }

  // ===== DISPUTE =====
  if (action === "dispute") {
    const { reason } = body;
    await supabase
      .from("trade_shipping_details")
      .update({ disputed: true, dispute_reason: reason || "Issue with received cards", updated_at: new Date().toISOString() })
      .eq("trade_offer_id", id);

    await supabase
      .from("trade_offers")
      .update({ status: "disputed", updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      notification_type: "trade_disputed",
      title: "Trade Disputed ⚠️",
      message: reason || "A dispute has been opened on your trade.",
      data: { trade_id: id },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
