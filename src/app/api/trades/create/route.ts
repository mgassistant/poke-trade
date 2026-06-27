// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateProtectionFee, getTradeProtection, getEffectiveTier } from "@/lib/trade-fees";
import type { MembershipTier, ShippingMethod } from "@/lib/trade-fees";
import { notifyNewTrade } from "@/lib/email-notifications";
import { getMaxTradeValue, getTraderLevel } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { receiver_id, items_offered, items_wanted, cash_amount, cash_offer, cash_want, notes, shipping_method, trade_protection_selected, declared_trade_value, protection_terms_accepted } = body;

  if (!receiver_id) return NextResponse.json({ error: "Receiver required" }, { status: 400 });
  if (receiver_id === user.id) return NextResponse.json({ error: "Cannot trade with yourself" }, { status: 400 });
  if (!items_offered?.length && !items_wanted?.length) {
    return NextResponse.json({ error: "At least one item must be offered or wanted" }, { status: 400 });
  }

  // Check blocks
  const { data: blocked } = await supabase
    .from("user_blocks")
    .select("id")
    .or(`and(blocker_id.eq.${receiver_id},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${receiver_id})`)
    .limit(1);

  if (blocked && blocked.length > 0) {
    return NextResponse.json({ error: "Cannot trade with this user" }, { status: 403 });
  }

  // Check that offered cards are not reserved for another trade
  if (items_offered?.length) {
    const offerCollectionIds = items_offered
      .map((i: { collection_item_id?: string }) => i.collection_item_id)
      .filter(Boolean);

    if (offerCollectionIds.length > 0) {
      const { data: reservedItems } = await supabase
        .from("collection_items")
        .select("id, reserved_for_trade_id")
        .in("id", offerCollectionIds)
        .not("reserved_for_trade_id", "is", null);

      if (reservedItems && reservedItems.length > 0) {
        return NextResponse.json(
          { error: "One or more cards are reserved for another trade and cannot be traded" },
          { status: 400 }
        );
      }
    }
  }

  // Fetch sender profile for trade limit check
  const { data: senderProfileForLimit } = await supabase
    .from("profiles")
    .select("total_trades")
    .eq("id", user.id)
    .single();

  const senderTotalTrades = senderProfileForLimit?.total_trades || 0;
  const senderMaxTradeValue = getMaxTradeValue(senderTotalTrades);
  const senderLevel = getTraderLevel(senderTotalTrades);

  // Calculate trade value
  let tradeValue = 0;
  let unevenTradeWarning = false;
  if (items_offered?.length || items_wanted?.length) {
    const offerCardIds = (items_offered || []).map((i: { card_id: string }) => i.card_id);
    const wantCardIds = (items_wanted || []).map((i: { card_id: string }) => i.card_id);
    const allCardIds = [...offerCardIds, ...wantCardIds];

    const { data: cardValues } = await supabase
      .from("cards")
      .select("id, market_value")
      .in("id", allCardIds);

    if (cardValues) {
      const valueMap = new Map(cardValues.map(c => [c.id, Number(c.market_value) || 0]));
      const offerTotal = offerCardIds.reduce((sum: number, id: string) => sum + (valueMap.get(id) || 0), 0);
      const wantTotal = wantCardIds.reduce((sum: number, id: string) => sum + (valueMap.get(id) || 0), 0);
      tradeValue = offerTotal + wantTotal;

      if (offerTotal > 0 && wantTotal > 0) {
        if (offerTotal > wantTotal * 2 || wantTotal > offerTotal * 2) {
          unevenTradeWarning = true;
        }
      }
    }
  }

  // Enforce trade value limit
  if (senderMaxTradeValue !== Infinity && tradeValue > senderMaxTradeValue) {
    return NextResponse.json(
      {
        error: `Your trader level (${senderLevel.name}) limits trades to $${senderMaxTradeValue} max. Complete more trades to increase your limit!`,
      },
      { status: 400 }
    );
  }

  // Calculate fee for protected shipping
  let feeAmount = 0;
  let feePerParty = 0;
  let protectionMaxBenefit = 0;
  const effectiveShippingMethod: ShippingMethod = shipping_method === 'protected' ? 'protected' : 'direct';
  if (effectiveShippingMethod === 'protected') {
    const senderTier = (senderProfile?.subscription_tier || 'free') as MembershipTier;
    const feeBreakdown = calculateProtectionFee(tradeValue, senderTier);
    feeAmount = feeBreakdown.totalFee;
    feePerParty = feeBreakdown.perParty;
    protectionMaxBenefit = feeBreakdown.maxProtectionBenefit;
  }

  // Calculate protection
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("username, display_name, subscription_tier")
    .eq("id", user.id)
    .single();

  const membershipTier = (senderProfile?.subscription_tier || "free") as MembershipTier;
  const protection = getTradeProtection(membershipTier, effectiveShippingMethod);
  const protectionAmount = protection.maxEligibleCredit;

  // Create trade offer
  const { data: trade, error: tradeError } = await supabase
    .from("trade_offers")
    .insert({
      sender_id: user.id,
      receiver_id,
      status: "pending",
      cash_offer: cash_offer || cash_amount || 0,
      cash_want: cash_want || 0,
      notes: unevenTradeWarning ? `⚠️ Uneven Trade Warning: Value difference exceeds 2x.${notes ? '\n' + notes : ''}` : (notes || null),
      shipping_method: effectiveShippingMethod,
      fee_amount: feeAmount,
      fee_per_party: feePerParty,
      protection_amount: protectionAmount,
      trade_value: tradeValue,
      trade_protection_selected: effectiveShippingMethod === 'protected',
      protection_fee_total: feeAmount,
      protection_fee_each: feePerParty,
      sender_tier: membershipTier,
      declared_trade_value: declared_trade_value || tradeValue,
      protection_terms_accepted_at: (effectiveShippingMethod === 'protected' && protection_terms_accepted) ? new Date().toISOString() : null,
      protection_terms_version: '1.0',
      protection_max_benefit: protectionMaxBenefit,
    })
    .select()
    .single();

  if (tradeError) return NextResponse.json({ error: tradeError.message }, { status: 500 });

  // Insert offered items (sender's cards)
  if (items_offered?.length) {
    const offerItems = items_offered.map((item: { card_id: string; collection_item_id?: string }) => ({
      trade_offer_id: trade.id,
      user_id: user.id,
      card_id: item.card_id,
      collection_item_id: item.collection_item_id || null,
    }));
    await supabase.from("trade_items").insert(offerItems);
  }

  // Insert wanted items (receiver's cards)
  if (items_wanted?.length) {
    const wantItems = items_wanted.map((item: { card_id: string; collection_item_id?: string }) => ({
      trade_offer_id: trade.id,
      user_id: receiver_id,
      card_id: item.card_id,
      collection_item_id: item.collection_item_id || null,
    }));
    await supabase.from("trade_items").insert(wantItems);
  }

  // Store version 1
  await supabase.from("trade_offer_versions").insert({
    trade_offer_id: trade.id,
    version_number: 1,
    proposed_by: user.id,
    action: "initial",
    cash_offer: cash_offer || cash_amount || 0,
    cash_want: cash_want || 0,
    notes: notes || null,
    items_offered: items_offered || [],
    items_wanted: items_wanted || [],
  });

  // Notify receiver
  await supabase.from("notifications").insert({
    user_id: receiver_id,
    notification_type: "trade_offer",
    title: "New Trade Offer",
    message: `${senderProfile?.display_name || senderProfile?.username || "Someone"} sent you a trade offer.`,
    data: { trade_id: trade.id },
  });

  // Activity feed
  await supabase.from("activity_feed").insert({
    user_id: user.id,
    activity_type: "trade_created",
    related_id: trade.id,
  });

  // Email notifications (fire-and-forget)
  const { data: receiverProfile } = await supabase
    .from("profiles")
    .select("username, display_name, email")
    .eq("id", receiver_id)
    .single();

  const senderDisplayName = senderProfile?.display_name || senderProfile?.username || "Unknown";
  const receiverDisplayName = receiverProfile?.display_name || receiverProfile?.username || "Unknown";

  if (receiverProfile?.email && user.email) {
    notifyNewTrade(
      senderDisplayName,
      receiverDisplayName,
      receiverProfile.email,
      user.email,
      tradeValue,
      trade.id
    );
  }

  return NextResponse.json({ trade, unevenTradeWarning });
}
