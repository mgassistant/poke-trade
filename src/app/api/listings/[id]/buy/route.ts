// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Please verify your email before purchasing." }, { status: 403 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get listing with seller info
  const { data: listing } = await serviceClient
    .from("listings")
    .select("id, title, price, status, user_id, card_id, shipping_cost, condition")
    .eq("id", id)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.status !== "active") return NextResponse.json({ error: "Listing is no longer available" }, { status: 400 });
  if (listing.user_id === user.id) return NextResponse.json({ error: "Cannot purchase your own listing" }, { status: 400 });

  // Get buyer's subscription tier for platform fee calculation
  const { data: buyerProfile } = await serviceClient
    .from("profiles")
    .select("stripe_customer_id, subscription_tier")
    .eq("id", user.id)
    .single();

  // Get or create Stripe customer
  let customerId = buyerProfile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await serviceClient
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // Calculate platform fee based on buyer's tier
  const tier = buyerProfile?.subscription_tier || "free";
  const feeRate = tier === "free" ? 0.05 : 0.03;
  const totalPrice = Number(listing.price) + Number(listing.shipping_cost || 0);
  const platformFee = Math.round(totalPrice * feeRate * 100); // in cents

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: listing.title || "Pokémon Card",
            description: `Condition: ${listing.condition || "Near Mint"}`,
            metadata: { listing_id: listing.id },
          },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "listing_purchase",
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.user_id,
      card_id: listing.card_id,
      platform_fee: String(platformFee),
      amount: String(Math.round(totalPrice * 100)),
    },
    payment_intent_data: {
      metadata: {
        type: "listing_purchase",
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.user_id,
      },
    },
    success_url: `${origin}/dashboard/purchases?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/marketplace?canceled=true`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
