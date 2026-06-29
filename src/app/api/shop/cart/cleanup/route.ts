import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/shop/cart/cleanup — Release expired cart reservations
export async function POST() {
  try {
    const now = new Date().toISOString();

    const { data: expiredItems, error: fetchError } = await supabase
      .from("shop_cart_items")
      .select("id, product_id, quantity")
      .lt("reserved_until", now);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredItems || expiredItems.length === 0) {
      return NextResponse.json({ cleaned: 0, message: "No expired reservations" });
    }

    const productReleases: Record<string, number> = {};
    for (const item of expiredItems) {
      productReleases[item.product_id] = (productReleases[item.product_id] || 0) + item.quantity;
    }

    let released = 0;
    for (const [productId, quantity] of Object.entries(productReleases)) {
      const { data: product } = await supabase
        .from("shop_products")
        .select("reserved_count")
        .eq("id", productId)
        .single();

      if (product) {
        const newReserved = Math.max(0, product.reserved_count - quantity);
        await supabase
          .from("shop_products")
          .update({ reserved_count: newReserved })
          .eq("id", productId);

        await supabase.from("shop_inventory_events").insert({
          product_id: productId,
          event_type: "reservation_expired",
          quantity,
          previous_inventory: product.reserved_count,
          new_inventory: newReserved,
          note: `Released ${quantity} expired reservation(s)`,
        });

        released += quantity;
      }
    }

    await supabase
      .from("shop_cart_items")
      .delete()
      .lt("reserved_until", now);

    return NextResponse.json({
      cleaned: expiredItems.length,
      released,
      products_affected: Object.keys(productReleases).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
