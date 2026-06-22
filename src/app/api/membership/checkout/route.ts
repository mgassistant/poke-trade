// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TIER_PRICES: Record<string, { name: string; amount: number }> = {
  pro: { name: "Pro Membership", amount: 999 },
  elite: { name: "Elite Membership", amount: 1999 },
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tier } = body;

  if (!tier || !TIER_PRICES[tier]) {
    return NextResponse.json({ error: "Invalid tier. Use: pro, elite" }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get or create Stripe customer
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("stripe_customer_id, subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier === tier) {
    return NextResponse.json({ error: "You are already on this plan" }, { status: 400 });
  }

  let customerId = profile?.stripe_customer_id;
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

  // Create or find a Stripe Price for this tier
  const tierInfo = TIER_PRICES[tier];

  // Search for existing product
  const products = await stripe.products.search({
    query: `metadata["tier"]:"${tier}"`,
  });

  let priceId: string;

  if (products.data.length > 0 && products.data[0].default_price) {
    priceId = typeof products.data[0].default_price === "string"
      ? products.data[0].default_price
      : products.data[0].default_price.id;
  } else {
    // Create product + price
    const product = await stripe.products.create({
      name: tierInfo.name,
      metadata: { tier },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tierInfo.amount,
      currency: "usd",
      recurring: { interval: "month" },
    });

    await stripe.products.update(product.id, { default_price: price.id });
    priceId = price.id;
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      user_id: user.id,
      tier,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        tier,
      },
    },
    success_url: `${origin}/dashboard/membership?success=true`,
    cancel_url: `${origin}/dashboard/membership?canceled=true`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
