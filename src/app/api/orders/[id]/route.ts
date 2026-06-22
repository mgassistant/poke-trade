// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// GET /api/orders/[id] — Order detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      listing:listings!orders_listing_id_fkey(
        id, title, price, condition, photos, card_id,
        card:cards!listings_card_id_fkey(id, name, number, rarity, image_url, market_value, card_sets(name))
      ),
      buyer:profiles!orders_buyer_id_fkey(id, username, display_name, avatar_url, trade_score),
      seller:profiles!orders_seller_id_fkey(id, username, display_name, avatar_url, trade_score)
    `)
    .eq("id", id)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Only buyer or seller can view
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({ order });
}

// PATCH /api/orders/[id] — Update order status (add tracking, confirm delivery, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order } = await serviceClient
    .from("orders")
    .select("id, buyer_id, seller_id, status, listing_id")
    .eq("id", id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const { action, tracking_number } = body;

  // Seller: add tracking / mark shipped
  if (action === "ship") {
    if (order.seller_id !== user.id) return NextResponse.json({ error: "Only seller can ship" }, { status: 403 });
    if (order.status !== "paid") return NextResponse.json({ error: "Order must be in paid status to ship" }, { status: 400 });

    const { data: updated, error } = await serviceClient
      .from("orders")
      .update({
        status: "shipped",
        shipping_tracking: tracking_number || null,
        shipped_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify buyer
    await serviceClient.from("notifications").insert({
      user_id: order.buyer_id,
      type: "order_shipped",
      title: "Order Shipped!",
      message: tracking_number ? `Your order has shipped! Tracking: ${tracking_number}` : "Your order has shipped!",
      data: { order_id: id },
    });

    return NextResponse.json({ order: updated });
  }

  // Buyer: confirm delivery
  if (action === "confirm_delivery") {
    if (order.buyer_id !== user.id) return NextResponse.json({ error: "Only buyer can confirm delivery" }, { status: 403 });
    if (order.status !== "shipped") return NextResponse.json({ error: "Order must be shipped first" }, { status: 400 });

    const { data: updated, error } = await serviceClient
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await serviceClient.from("notifications").insert({
      user_id: order.seller_id,
      type: "order_delivered",
      title: "Order Delivered",
      message: "Buyer confirmed delivery of your order",
      data: { order_id: id },
    });

    return NextResponse.json({ order: updated });
  }

  // Either party: mark completed (after delivery)
  if (action === "complete") {
    if (order.status !== "delivered") return NextResponse.json({ error: "Order must be delivered first" }, { status: 400 });

    const { data: updated, error } = await serviceClient
      .from("orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update seller's total_sales (best effort)
    try {
      await serviceClient.rpc("increment_total_sales", { user_id_param: order.seller_id });
    } catch {
      // RPC may not exist, ignore
    }

    return NextResponse.json({ order: updated });
  }

  return NextResponse.json({ error: "Invalid action. Use: ship, confirm_delivery, complete" }, { status: 400 });
}
