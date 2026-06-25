import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RESERVATION_MINUTES = 15;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Clear expired reservations first
  await supabase
    .from("shop_cart_items")
    .delete()
    .eq("user_id", user.id)
    .lt("reserved_until", new Date().toISOString());

  const { data, error } = await supabase
    .from("shop_cart_items")
    .select("*, product:shop_products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to add items to cart" }, { status: 401 });

  const { product_id, quantity = 1 } = await request.json();
  if (!product_id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  // Check product availability
  const { data: product } = await supabase
    .from("shop_products")
    .select("*")
    .eq("id", product_id)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.status !== "active") {
    return NextResponse.json({ error: "Product is not available" }, { status: 400 });
  }

  // Check membership requirements
  if (product.requires_membership || product.premium_only) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, subscription_tier")
      .eq("id", user.id)
      .single();

    if (product.premium_only && !profile?.is_premium) {
      return NextResponse.json({ error: "Premium membership required" }, { status: 403 });
    }
    if (product.requires_membership && profile?.subscription_tier === "free") {
      return NextResponse.json({ error: "Membership required" }, { status: 403 });
    }
  }

  // Check inventory
  const available = product.inventory_count - product.reserved_count;
  if (available < quantity) {
    return NextResponse.json({ error: "Not enough inventory" }, { status: 400 });
  }

  // Check per-member limit
  if (quantity > (product.max_qty_per_member ?? 1)) {
    return NextResponse.json({
      error: `Maximum ${product.max_qty_per_member} per member`,
    }, { status: 400 });
  }

  const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();

  // Upsert cart item
  const { data: existing } = await supabase
    .from("shop_cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .single();

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > (product.max_qty_per_member ?? 1)) {
      return NextResponse.json({
        error: `Maximum ${product.max_qty_per_member} per member`,
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("shop_cart_items")
      .update({ quantity: newQty, reserved_until: reservedUntil })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update reserved count
    await supabase
      .from("shop_products")
      .update({ reserved_count: product.reserved_count + quantity })
      .eq("id", product_id);

    return NextResponse.json({ item: data });
  }

  const { data, error } = await supabase
    .from("shop_cart_items")
    .insert({
      user_id: user.id,
      product_id,
      quantity,
      reserved_until: reservedUntil,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update reserved count
  await supabase
    .from("shop_products")
    .update({ reserved_count: product.reserved_count + quantity })
    .eq("id", product_id);

  return NextResponse.json({ item: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id } = await request.json();

  // Get cart item to release reservation
  const { data: cartItem } = await supabase
    .from("shop_cart_items")
    .select("quantity, product_id")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .single();

  if (cartItem) {
    // Release reserved inventory
    const { data: product } = await supabase
      .from("shop_products")
      .select("reserved_count")
      .eq("id", product_id)
      .single();

    if (product) {
      await supabase
        .from("shop_products")
        .update({
          reserved_count: Math.max(0, product.reserved_count - cartItem.quantity),
        })
        .eq("id", product_id);
    }
  }

  await supabase
    .from("shop_cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", product_id);

  return NextResponse.json({ success: true });
}
