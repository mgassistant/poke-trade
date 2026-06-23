// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { receiver_id, items_offered, items_wanted, cash_amount, notes, shipping_method } = body;

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

  // Calculate trade value balance for uneven trade warning
  let unevenTradeWarning = false;
  if (items_offered?.length && items_wanted?.length) {
    const offerCardIds = items_offered.map((i: { card_id: string }) => i.card_id);
    const wantCardIds = items_wanted.map((i: { card_id: string }) => i.card_id);
    const allCardIds = [...offerCardIds, ...wantCardIds];

    const { data: cardValues } = await supabase
      .from("cards")
      .select("id, market_value")
      .in("id", allCardIds);

    if (cardValues) {
      const valueMap = new Map(cardValues.map(c => [c.id, Number(c.market_value) || 0]));
      const offerTotal = offerCardIds.reduce((sum: number, id: string) => sum + (valueMap.get(id) || 0), 0);
      const wantTotal = wantCardIds.reduce((sum: number, id: string) => sum + (valueMap.get(id) || 0), 0);

      if (offerTotal > 0 && wantTotal > 0) {
        if (offerTotal > wantTotal * 2 || wantTotal > offerTotal * 2) {
          unevenTradeWarning = true;
        }
      }
    }
  }

  // Create trade offer
  const { data: trade, error: tradeError } = await supabase
    .from("trade_offers")
    .insert({
      sender_id: user.id,
      receiver_id,
      status: "pending",
      cash_amount: cash_amount || null,
      notes: unevenTradeWarning ? `⚠️ Uneven Trade Warning: Value difference exceeds 2x.${notes ? '\n' + notes : ''}` : (notes || null),
      shipping_method: shipping_method || 'direct',
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
    cash_amount: cash_amount || null,
    notes: notes || null,
    items_offered: items_offered || [],
    items_wanted: items_wanted || [],
  });

  // Notify receiver
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

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

  return NextResponse.json({ trade, unevenTradeWarning });
}
