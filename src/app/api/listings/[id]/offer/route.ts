// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// POST /api/listings/[id]/offer — Make, accept, decline, or counter an offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, amount, offer_id, counter_amount, message } = body;

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get listing
  const { data: listing } = await serviceClient
    .from("listings")
    .select("id, user_id, price, status, accepts_offers, title")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // CREATE a new offer
  if (action === "create") {
    if (listing.status !== "active") return NextResponse.json({ error: "Listing not available" }, { status: 400 });
    if (!listing.accepts_offers) return NextResponse.json({ error: "Listing does not accept offers" }, { status: 400 });
    if (listing.user_id === user.id) return NextResponse.json({ error: "Cannot make an offer on your own listing" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Offer amount must be positive" }, { status: 400 });

    // Check for existing pending offer
    const { data: existing } = await serviceClient
      .from("offers")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .single();

    if (existing) return NextResponse.json({ error: "You already have a pending offer on this listing" }, { status: 400 });

    const { data: offer, error } = await serviceClient
      .from("offers")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        amount,
        message: message || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify seller
    await serviceClient.from("notifications").insert({
      user_id: listing.user_id,
      type: "offer_received",
      title: "New Offer Received",
      message: `You received a $${amount} offer on "${listing.title}"`,
      data: { offer_id: offer.id, listing_id: listingId },
    });

    return NextResponse.json({ offer });
  }

  // ACCEPT, DECLINE, COUNTER — seller actions
  if (!offer_id) return NextResponse.json({ error: "offer_id required" }, { status: 400 });

  const { data: offer } = await serviceClient
    .from("offers")
    .select("id, listing_id, buyer_id, amount, status")
    .eq("id", offer_id)
    .single();

  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.listing_id !== listingId) return NextResponse.json({ error: "Offer does not belong to this listing" }, { status: 400 });

  if (action === "accept") {
    if (listing.user_id !== user.id) return NextResponse.json({ error: "Only the seller can accept offers" }, { status: 403 });
    if (offer.status !== "pending" && offer.status !== "countered") return NextResponse.json({ error: "Offer is not pending" }, { status: 400 });

    // Update listing price to offer amount and mark sold
    await serviceClient.from("listings").update({ price: offer.amount, status: "sold" }).eq("id", listingId);
    await serviceClient.from("offers").update({ status: "accepted" }).eq("id", offer_id);

    // Decline other pending offers on this listing
    await serviceClient.from("offers").update({ status: "declined" }).eq("listing_id", listingId).neq("id", offer_id).in("status", ["pending", "countered"]);

    // Create order
    const feeRate = 0.05; // default; could look up seller tier
    const orderAmount = Number(offer.amount);
    const platformFee = Math.round(orderAmount * feeRate * 100) / 100;

    const { data: order } = await serviceClient.from("orders").insert({
      listing_id: listingId,
      buyer_id: offer.buyer_id,
      seller_id: listing.user_id,
      amount: orderAmount,
      platform_fee: platformFee,
      seller_payout: orderAmount - platformFee,
      status: "paid",
    }).select().single();

    // Notify buyer
    await serviceClient.from("notifications").insert({
      user_id: offer.buyer_id,
      type: "offer_accepted",
      title: "Offer Accepted!",
      message: `Your $${offer.amount} offer on "${listing.title}" was accepted`,
      data: { offer_id: offer.id, order_id: order?.id },
    });

    return NextResponse.json({ offer: { ...offer, status: "accepted" }, order });
  }

  if (action === "decline") {
    if (listing.user_id !== user.id) return NextResponse.json({ error: "Only the seller can decline offers" }, { status: 403 });

    await serviceClient.from("offers").update({ status: "declined" }).eq("id", offer_id);

    await serviceClient.from("notifications").insert({
      user_id: offer.buyer_id,
      type: "offer_declined",
      title: "Offer Declined",
      message: `Your offer on "${listing.title}" was declined`,
      data: { offer_id: offer.id },
    });

    return NextResponse.json({ success: true });
  }

  if (action === "counter") {
    if (listing.user_id !== user.id) return NextResponse.json({ error: "Only the seller can counter" }, { status: 403 });
    if (!counter_amount || counter_amount <= 0) return NextResponse.json({ error: "Counter amount required" }, { status: 400 });

    await serviceClient.from("offers").update({ status: "countered", counter_amount }).eq("id", offer_id);

    await serviceClient.from("notifications").insert({
      user_id: offer.buyer_id,
      type: "offer_countered",
      title: "Counter Offer",
      message: `Seller countered with $${counter_amount} on "${listing.title}"`,
      data: { offer_id: offer.id, counter_amount },
    });

    return NextResponse.json({ success: true, counter_amount });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET /api/listings/[id]/offer — Get offers for a listing
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: offers, error } = await supabase
    .from("offers")
    .select(`
      *,
      buyer:profiles!offers_buyer_id_fkey(id, username, display_name, avatar_url, trade_score)
    `)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ offers });
}
