/**
 * POST /api/drops/target-monitor — Start Target drop monitoring + auto-cart
 * GET  /api/drops/target-monitor — Check stock for specific TCIN
 * 
 * Admin only. Monitors Target products and attempts auto-cart when stock appears.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkTargetStock, addToTargetCart } from "@/lib/restock-monitor/target-bot";
import { TARGET_DROPS_2026_06_29 } from "@/lib/restock-monitor/target-drops";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Check stock for one or all Target products
export async function GET(req: NextRequest) {
  const tcin = req.nextUrl.searchParams.get("tcin");
  const checkAll = req.nextUrl.searchParams.get("all") === "true";

  if (tcin) {
    const result = await checkTargetStock(tcin);
    return NextResponse.json(result);
  }

  if (checkAll) {
    const results = [];
    for (const product of TARGET_DROPS_2026_06_29) {
      const stock = await checkTargetStock(product.tcin);
      results.push({
        name: product.product_name,
        sku: product.sku,
        tcin: product.tcin,
        ...stock,
        estimated_stock: product.estimated_stock,
        priority: product.priority,
        auto_buy: product.auto_buy,
      });
      // Rate limit: 500ms between checks
      await new Promise((r) => setTimeout(r, 500));
    }

    const inStock = results.filter((r) => r.available);
    const outOfStock = results.filter((r) => !r.available);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      total: results.length,
      in_stock: inStock.length,
      out_of_stock: outOfStock.length,
      results,
    });
  }

  return NextResponse.json({
    usage: "GET ?tcin=94681790 or ?all=true",
    products: TARGET_DROPS_2026_06_29.map((p) => ({
      name: p.product_name,
      sku: p.sku,
      tcin: p.tcin,
      priority: p.priority,
      auto_buy: p.auto_buy,
      estimated_stock: p.estimated_stock,
    })),
    drop_time: "2026-06-29 12:00 AM PST",
  });
}

// POST: Attempt to add items to cart
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, tcin, tcins } = body as {
    action: "check" | "cart" | "cart-all-priority";
    tcin?: string;
    tcins?: string[];
  };

  if (action === "check" && tcin) {
    const result = await checkTargetStock(tcin);
    return NextResponse.json(result);
  }

  if (action === "cart" && tcin) {
    const stock = await checkTargetStock(tcin);
    if (!stock.available) {
      return NextResponse.json({ success: false, error: "Not in stock", stock });
    }

    const cartResult = await addToTargetCart(tcin, 1);

    // Log the attempt
    await supabase.from("drop_purchases").insert({
      retailer: "target",
      status: cartResult.success ? "carted" : "failed",
      purchase_price: stock.price,
      quantity: 1,
      metadata: {
        tcin,
        product_name: cartResult.productName,
        cart_url: cartResult.cartUrl,
        error: cartResult.error,
        stock_check: stock,
      },
    }).catch(() => {}); // Don't fail if logging fails

    return NextResponse.json(cartResult);
  }

  if (action === "cart-all-priority") {
    // Cart all auto-buy priority items that are in stock
    const priorityProducts = TARGET_DROPS_2026_06_29.filter((p) => p.auto_buy);
    const results = [];

    for (const product of priorityProducts) {
      const stock = await checkTargetStock(product.tcin);

      if (stock.available) {
        if (stock.price && stock.price > product.max_price) {
          results.push({
            name: product.product_name,
            tcin: product.tcin,
            success: false,
            reason: `Price $${stock.price} exceeds max $${product.max_price}`,
          });
          continue;
        }

        const cartResult = await addToTargetCart(product.tcin, 1);
        results.push({
          name: product.product_name,
          tcin: product.tcin,
          success: cartResult.success,
          price: stock.price,
          error: cartResult.error,
        });

        // Log
        await supabase.from("drop_purchases").insert({
          retailer: "target",
          status: cartResult.success ? "carted" : "failed",
          purchase_price: stock.price,
          quantity: 1,
          metadata: {
            tcin: product.tcin,
            product_name: product.product_name,
            auto_buy: true,
            drop_date: "2026-06-29",
          },
        }).catch(() => {});

        await new Promise((r) => setTimeout(r, 300));
      } else {
        results.push({
          name: product.product_name,
          tcin: product.tcin,
          success: false,
          reason: "Not in stock",
        });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      attempted: results.length,
      carted: results.filter((r) => r.success).length,
      results,
    });
  }

  return NextResponse.json({ error: "Invalid action. Use: check, cart, cart-all-priority" }, { status: 400 });
}
