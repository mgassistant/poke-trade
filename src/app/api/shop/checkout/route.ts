import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { checkPurchaseLimit, checkCooldown } from "@/lib/shop/anti-scalper";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to checkout" }, { status: 401 });

  // Cooldown check
  const cooldownResult = await checkCooldown(user.id);
  if (!cooldownResult.allowed) {
    return NextResponse.json({ error: cooldownResult.reason }, { status: 429 });
  }

  // Get cart items with product data
  const { data: cartItems } = await supabase
    .from("shop_cart_items")
    .select("*, product:shop_products(*)")
    .eq("user_id", user.id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Get user profile for pricing tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, subscription_tier, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium ?? false;
  const isMember = profile?.subscription_tier !== "free";

  // Validate each item
  const lineItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = item.product as Record<string, unknown>;
    if (!product) continue;

    // Check inventory
    const available = (product.inventory_count as number) - (product.reserved_count as number);
    if (available < item.quantity) {
      return NextResponse.json({
        error: `"${product.title}" is out of stock`,
      }, { status: 400 });
    }

    // Anti-scalper: purchase limit check
    const limitCheck = await checkPurchaseLimit(user.id, product.id as string);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 400 });
    }

    // Determine price tier (server-side, never trust client)
    let unitPrice: number;
    let priceType: string;

    if (isPremium && product.premium_member_price) {
      unitPrice = product.premium_member_price as number;
      priceType = "premium_member";
    } else if (isMember && product.member_price) {
      unitPrice = product.member_price as number;
      priceType = "member";
    } else {
      unitPrice = (product.public_price as number) ?? (product.market_price as number) ?? 0;
      priceType = "public";
    }

    subtotal += unitPrice * item.quantity;

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.title as string,
          description: product.condition ? `Condition: ${product.condition}` : undefined,
          images: Array.isArray(product.images) && (product.images as string[]).length > 0
            ? [(product.images as string[])[0]]
            : undefined,
          metadata: {
            product_id: product.id as string,
            slug: product.slug as string,
          },
        },
        unit_amount: Math.round(unitPrice * 100),
      },
      quantity: item.quantity,
    });
  }

  // Create order record
  const { data: order, error: orderError } = await supabase
    .from("shop_orders")
    .insert({
      user_id: user.id,
      subtotal,
      tax: 0,
      shipping: 0,
      total: subtotal,
      status: "pending",
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Create order items
  const orderItems = cartItems.map((item) => {
    const product = item.product as Record<string, unknown>;
    let unitPrice: number;
    let priceType: string;

    if (isPremium && product.premium_member_price) {
      unitPrice = product.premium_member_price as number;
      priceType = "premium_member";
    } else if (isMember && product.member_price) {
      unitPrice = product.member_price as number;
      priceType = "member";
    } else {
      unitPrice = (product.public_price as number) ?? (product.market_price as number) ?? 0;
      priceType = "public";
    }

    return {
      order_id: order.id,
      product_id: product.id as string,
      quantity: item.quantity,
      unit_price: unitPrice,
      price_type: priceType,
      product_snapshot: product,
    };
  });

  await supabase.from("shop_order_items").insert(orderItems);

  const { url } = request.nextUrl;
  const origin = new URL(url).origin;

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: profile?.stripe_customer_id || undefined,
    customer_email: !profile?.stripe_customer_id ? user.email : undefined,
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    metadata: {
      type: "shop_purchase",
      order_id: order.id,
      user_id: user.id,
    },
    success_url: `${origin}/dashboard/orders?success=true&order_id=${order.id}`,
    cancel_url: `${origin}/shop/cart?canceled=true`,
  });

  // Update order with Stripe session ID
  await supabase
    .from("shop_orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
