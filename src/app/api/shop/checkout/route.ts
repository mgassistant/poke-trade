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

  // Re-validate inventory and refresh reservations at checkout time
  // Cart reservations may have expired since items were added
  const CHECKOUT_RESERVATION_MINUTES = 30;
  const checkoutReservedUntil = new Date(Date.now() + CHECKOUT_RESERVATION_MINUTES * 60 * 1000).toISOString();

  const lineItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = item.product as Record<string, unknown>;
    if (!product) continue;

    // Re-fetch fresh inventory data (cart join may be stale)
    const { data: freshProduct } = await supabase
      .from("shop_products")
      .select("inventory_count, reserved_count, status, title")
      .eq("id", product.id as string)
      .single();

    if (!freshProduct || freshProduct.status !== "active") {
      return NextResponse.json({
        error: `"${freshProduct?.title || product.title}" is no longer available`,
      }, { status: 400 });
    }

    // Check fresh inventory
    const available = freshProduct.inventory_count - freshProduct.reserved_count;
    if (available < item.quantity) {
      return NextResponse.json({
        error: `"${freshProduct.title}" is out of stock (only ${Math.max(0, available)} available)`,
      }, { status: 400 });
    }

    // Refresh cart reservation timestamp for checkout window
    await supabase
      .from("shop_cart_items")
      .update({ reserved_until: checkoutReservedUntil })
      .eq("id", item.id);

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

  // Calculate shipping based on items
  const hasSealed = cartItems.some((item) => (item.product as Record<string, unknown>)?.category === "sealed");
  const hasSingles = cartItems.some((item) => {
    const cat = (item.product as Record<string, unknown>)?.category;
    return cat === "singles" || cat === "graded";
  });
  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Shipping tiers: free over $75, else $3.99 singles / $7.99 sealed
  let shipping = 0;
  if (subtotal < 75) {
    if (hasSealed) {
      shipping = 7.99;
    } else if (hasSingles) {
      shipping = 3.99;
    } else {
      shipping = 4.99;
    }
    // Add $1.99 for each additional item beyond the first
    if (totalQty > 1) {
      shipping += (totalQty - 1) * 1.99;
    }
  }

  // Create order record
  const { data: order, error: orderError } = await supabase
    .from("shop_orders")
    .insert({
      user_id: user.id,
      subtotal,
      tax: 0,
      shipping,
      total: subtotal + shipping,
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

  // Add shipping line item if applicable
  if (shipping > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Shipping",
          description: subtotal >= 75 ? undefined : `Standard shipping (free on orders $75+)`,
        },
        unit_amount: Math.round(shipping * 100),
      },
      quantity: 1,
    });
  }

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
