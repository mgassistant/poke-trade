// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REASON_CATEGORIES = [
  "Item not received",
  "Item not as described",
  "Counterfeit/fake",
  "Damaged in shipping",
  "Seller didn't ship",
  "Buyer didn't pay",
  "Other",
] as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    trade_offer_id,
    listing_id,
    reason_category,
    description,
    evidence_photos,
  } = body;

  if (!reason_category || !description) {
    return NextResponse.json(
      { error: "Reason category and description are required" },
      { status: 400 }
    );
  }

  if (!REASON_CATEGORIES.includes(reason_category)) {
    return NextResponse.json(
      { error: "Invalid reason category" },
      { status: 400 }
    );
  }

  if (description.length > 2000) {
    return NextResponse.json(
      { error: "Description must be 2000 characters or less" },
      { status: 400 }
    );
  }

  // Determine the trade to dispute
  let tradeId = trade_offer_id;
  let respondentId: string | null = null;

  if (tradeId) {
    const { data: trade } = await supabase
      .from("trade_offers")
      .select("*")
      .eq("id", tradeId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single();

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    respondentId = trade.sender_id === user.id ? trade.receiver_id : trade.sender_id;
  } else if (listing_id) {
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    respondentId = listing.seller_id !== user.id ? listing.seller_id : null;
  } else {
    return NextResponse.json(
      { error: "Either trade_offer_id or listing_id is required" },
      { status: 400 }
    );
  }

  // Check for existing open dispute
  if (tradeId) {
    const { data: existing } = await supabase
      .from("disputes")
      .select("id")
      .eq("trade_offer_id", tradeId)
      .in("status", ["open", "investigating"])
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "An open dispute already exists for this trade" },
        { status: 400 }
      );
    }
  }

  // Create the dispute
  const { data: dispute, error } = await supabase
    .from("disputes")
    .insert({
      trade_offer_id: tradeId || null,
      initiator_id: user.id,
      respondent_id: respondentId,
      reason: reason_category,
      reason_category,
      details: description,
      evidence_description: description,
      evidence_photos: evidence_photos ?? [],
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update trade status if applicable
  if (tradeId) {
    await supabase
      .from("trade_offers")
      .update({ status: "disputed" as "completed", updated_at: new Date().toISOString() })
      .eq("id", tradeId);
  }

  // Notify respondent
  if (respondentId) {
    await supabase.from("notifications").insert({
      user_id: respondentId,
      notification_type: "dispute_opened",
      title: "Dispute Filed Against You ⚠️",
      message: `A dispute has been opened: ${reason_category}. Please review and respond.`,
      data: { dispute_id: dispute.id, trade_id: tradeId },
    });
  }

  // Auto-pull trade documentation as initial evidence message
  if (tradeId) {
    const { data: tradeDocs } = await supabase
      .from("trade_documentation")
      .select("*")
      .eq("trade_id", tradeId)
      .limit(1);

    if (tradeDocs && tradeDocs.length > 0) {
      await supabase.from("dispute_messages").insert({
        dispute_id: dispute.id,
        sender_id: user.id,
        message: "Auto-attached trade documentation and tracking information.",
        attachments: tradeDocs[0]?.photos ?? [],
        is_admin: false,
      });
    }
  }

  return NextResponse.json({ dispute });
}
