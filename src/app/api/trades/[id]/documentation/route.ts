// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  hashTradeRecord,
  type TradeRecord,
  type TradeEvent,
  type TradeCardItem,
  type TradeParticipant,
  type TradeVersion,
  type TradeReviewSummary,
  type ShippingRecord,
} from "@/lib/trade-documentation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get trade with participants
  const { data: trade, error: tradeError } = await supabase
    .from("trade_offers")
    .select(`
      *,
      sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url, trust_score, verification_level),
      receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url, trust_score, verification_level),
      trade_items(*, cards(id, name, number, image_url, market_value, rarity, card_type, card_sets(name))),
      trade_offer_versions(*)
    `)
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (tradeError || !trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  // Get trade events
  const { data: events } = await supabase
    .from("trade_events")
    .select("*")
    .eq("trade_id", id)
    .order("created_at", { ascending: true });

  // Get shipping details
  const { data: shipping } = await supabase
    .from("trade_shipping_details")
    .select("*")
    .eq("trade_offer_id", id)
    .single();

  // Get reviews for this trade
  const { data: reviews } = await supabase
    .from("reviews")
    .select("reviewer_id, reviewee_id, rating, communication_rating, accuracy_rating, shipping_rating, condition_rating, comment, created_at")
    .eq("trade_offer_id", id);

  // Build participants
  const sender: TradeParticipant = {
    id: trade.sender.id,
    username: trade.sender.username,
    display_name: trade.sender.display_name,
    avatar_url: trade.sender.avatar_url,
    trust_score: trade.sender.trust_score || 100,
    verification_level: trade.sender.verification_level || 0,
  };

  const receiver: TradeParticipant = {
    id: trade.receiver.id,
    username: trade.receiver.username,
    display_name: trade.receiver.display_name,
    avatar_url: trade.receiver.avatar_url,
    trust_score: trade.receiver.trust_score || 100,
    verification_level: trade.receiver.verification_level || 0,
  };

  // Build items
  const items: TradeCardItem[] = (trade.trade_items || []).map((item: any) => ({
    card_id: item.card_id,
    card_name: item.cards?.name || "Unknown Card",
    card_number: item.cards?.number || "?",
    card_set: item.cards?.card_sets?.name || "Unknown Set",
    market_value: item.cards?.market_value || null,
    condition: null,
    image_url: item.cards?.image_url || null,
    owner_id: item.user_id,
  }));

  // Build shipping record
  const shippingRecord: ShippingRecord | null = shipping
    ? {
        sender_tracking: shipping.sender_tracking || null,
        sender_carrier: shipping.sender_carrier || null,
        sender_shipped_at: shipping.sender_shipped_at || null,
        sender_received_at: shipping.sender_received_at || null,
        sender_confirmed: shipping.sender_confirmed || false,
        receiver_tracking: shipping.receiver_tracking || null,
        receiver_carrier: shipping.receiver_carrier || null,
        receiver_shipped_at: shipping.receiver_shipped_at || null,
        receiver_received_at: shipping.receiver_received_at || null,
        receiver_confirmed: shipping.receiver_confirmed || false,
        sender_photos: shipping.sender_photos || [],
        receiver_photos: shipping.receiver_photos || [],
      }
    : null;

  // Build versions
  const versions: TradeVersion[] = (trade.trade_offer_versions || [])
    .sort((a: any, b: any) => a.version_number - b.version_number)
    .map((v: any) => ({
      version_number: v.version_number,
      proposed_by: v.proposed_by,
      action: v.action,
      cash_amount: v.cash_amount,
      notes: v.notes,
      items_offered: v.items_offered || [],
      items_wanted: v.items_wanted || [],
      created_at: v.created_at,
    }));

  // Build review summaries
  const reviewSummaries: TradeReviewSummary[] = (reviews || []).map((r: any) => ({
    reviewer_id: r.reviewer_id,
    reviewee_id: r.reviewee_id,
    rating: r.rating,
    communication_rating: r.communication_rating || null,
    accuracy_rating: r.accuracy_rating || null,
    shipping_rating: r.shipping_rating || null,
    condition_rating: r.condition_rating || null,
    comment: r.comment || null,
    created_at: r.created_at,
  }));

  // Build trade events list
  const tradeEvents: TradeEvent[] = (events || []).map((e: any) => ({
    id: e.id,
    trade_id: e.trade_id,
    event_type: e.event_type,
    actor_id: e.actor_id,
    details: e.details || {},
    photos: e.photos || [],
    integrity_hash: e.integrity_hash || null,
    created_at: e.created_at,
  }));

  const generatedAt = new Date().toISOString();

  const recordWithoutHash: Omit<TradeRecord, "integrity_hash"> = {
    trade_id: id,
    status: trade.status,
    created_at: trade.created_at,
    completed_at: trade.completed_at || null,
    sender,
    receiver,
    items,
    cash_amount: trade.cash_amount || null,
    trade_value: trade.trade_value || null,
    shipping_method: trade.shipping_method || null,
    shipping: shippingRecord,
    events: tradeEvents,
    versions,
    reviews: reviewSummaries,
    generated_at: generatedAt,
  };

  const integrityHash = await hashTradeRecord(recordWithoutHash);

  const record: TradeRecord = {
    ...recordWithoutHash,
    integrity_hash: integrityHash,
  };

  return NextResponse.json({ record });
}
