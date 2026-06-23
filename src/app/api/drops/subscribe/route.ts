import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** GET — check current user's drop alerts subscription status */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("drop_alerts_active, drop_alerts_subscription_id")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    active: profile?.drop_alerts_active ?? false,
    subscription_id: profile?.drop_alerts_subscription_id ?? null,
  });
}

/** POST — create Stripe Checkout session for Drop Alerts $5.99/mo add-on */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already subscribed
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("drop_alerts_active, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.drop_alerts_active) {
    return NextResponse.json(
      { error: "You already have an active Drop Alerts subscription" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
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

  const priceId = process.env.STRIPE_DROP_ALERTS_PRICE_ID;

  if (!priceId) {
    // Auto-create product + price in Stripe if env var not set
    const products = await stripe.products.search({
      query: 'metadata["type"]:"drop_alerts"',
    });

    let resolvedPriceId: string;

    if (products.data.length > 0 && products.data[0].default_price) {
      resolvedPriceId =
        typeof products.data[0].default_price === "string"
          ? products.data[0].default_price
          : products.data[0].default_price.id;
    } else {
      const product = await stripe.products.create({
        name: "Drop Alerts Pro",
        description:
          "Instant restock alerts, price drop notifications, and watchlist access across 8 retailers.",
        metadata: { type: "drop_alerts" },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 599,
        currency: "usd",
        recurring: { interval: "month" },
      });
      await stripe.products.update(product.id, { default_price: price.id });
      resolvedPriceId = price.id;
    }

    return createCheckoutSession(request, customerId, resolvedPriceId, user.id);
  }

  return createCheckoutSession(request, customerId, priceId, user.id);
}

async function createCheckoutSession(
  request: NextRequest,
  customerId: string,
  priceId: string,
  userId: string
) {
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      user_id: userId,
      type: "drop_alerts",
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        type: "drop_alerts",
      },
    },
    success_url: `${origin}/dashboard/drops?subscribed=true`,
    cancel_url: `${origin}/drops`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
