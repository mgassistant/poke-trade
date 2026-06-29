/**
 * POST /api/drops/seed-target — Seed Target drop products for monitoring
 * Admin only. Seeds the real Target SKUs for tonight's drop.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TARGET_DROPS_2026_06_29 } from "@/lib/restock-monitor/target-drops";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const products = TARGET_DROPS_2026_06_29.map((p) => ({
    retailer: "target",
    product_name: p.product_name,
    product_url: p.product_url,
    sku: p.sku,
    retail_price: p.retail_price,
    current_price: p.retail_price,
    in_stock: false, // All start as OOS, monitor will detect when they go live
    category: p.category,
    set_name: p.set_name,
    active: true,
    priority: p.priority,
    auto_buy_enabled: p.auto_buy,
    auto_buy_max_price: p.max_price,
    auto_buy_quantity: 1,
    metadata: {
      estimated_stock: p.estimated_stock,
      drop_date: "2026-06-29T07:00:00.000Z", // 12AM PST = 7AM UTC
      source: "CCN restock intel",
      tcin: p.tcin,
    },
  }));

  // Upsert by SKU to avoid duplicates
  const results = [];
  for (const product of products) {
    const { data, error } = await supabase
      .from("drop_products")
      .upsert(product, { onConflict: "sku" })
      .select("id, product_name, sku");

    if (error) {
      // If upsert fails (no unique constraint on sku), try insert
      const { data: insertData, error: insertError } = await supabase
        .from("drop_products")
        .insert(product)
        .select("id, product_name, sku");

      if (insertError) {
        results.push({ sku: product.sku, name: product.product_name, error: insertError.message });
      } else {
        results.push({ sku: product.sku, name: product.product_name, id: insertData?.[0]?.id });
      }
    } else {
      results.push({ sku: product.sku, name: product.product_name, id: data?.[0]?.id });
    }
  }

  return NextResponse.json({
    success: true,
    total: products.length,
    results,
    drop_time: "2026-06-29 12:00 AM PST (3:00 AM EST)",
    auto_buy_count: products.filter((p) => p.auto_buy_enabled).length,
  });
}
