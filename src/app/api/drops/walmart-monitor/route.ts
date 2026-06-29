/**
 * POST /api/drops/walmart-monitor — Start Walmart drop monitoring + auto-cart
 * GET  /api/drops/walmart-monitor — Check stock for all Walmart products
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkWalmartStock, addToWalmartCart } from "@/lib/restock-monitor/walmart-bot";
import { WALMART_DROPS_2026_06_29 } from "@/lib/restock-monitor/walmart-drops";
import { sendDropAlert } from "@/lib/restock-monitor/sms-alert";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Check stock for one or all Walmart products
export async function GET(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get("itemId");
  const checkAll = req.nextUrl.searchParams.get("all") === "true";

  if (itemId) {
    const result = await checkWalmartStock(itemId);
    return NextResponse.json(result);
  }

  if (checkAll) {
    const results = [];
    for (const product of WALMART_DROPS_2026_06_29) {
      const stock = await checkWalmartStock(product.item_id);
      results.push({
        name: product.product_name,
        item_id: product.item_id,
        url: product.product_url,
        ...stock,
        priority: product.priority,
        auto_buy: product.auto_buy,
      });
      // Rate limit: 1s between checks (Walmart is more aggressive with blocking)
      await new Promise((r) => setTimeout(r, 1000));
    }

    const inStock = results.filter((r) => r.available);
    const outOfStock = results.filter((r) => !r.available);

    return NextResponse.json({
      retailer: "walmart",
      timestamp: new Date().toISOString(),
      total: results.length,
      in_stock: inStock.length,
      out_of_stock: outOfStock.length,
      results,
    });
  }

  return NextResponse.json({
    usage: "GET ?itemId=17823811037 or ?all=true",
    products: WALMART_DROPS_2026_06_29.map((p) => ({
      name: p.product_name,
      item_id: p.item_id,
      url: p.product_url,
      priority: p.priority,
      auto_buy: p.auto_buy,
    })),
  });
}

// POST: Attempt to add items to cart
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, itemId } = body as {
    action: "check" | "cart" | "cart-all-priority";
    itemId?: string;
  };

  if (action === "check" && itemId) {
    const result = await checkWalmartStock(itemId);
    return NextResponse.json(result);
  }

  if (action === "cart" && itemId) {
    const stock = await checkWalmartStock(itemId);
    if (!stock.available) {
      return NextResponse.json({ success: false, error: "Not in stock", stock });
    }

    const cartResult = await addToWalmartCart(itemId, 1);

    await supabase.from("drop_purchases").insert({
      retailer: "walmart",
      status: cartResult.success ? "carted" : "failed",
      purchase_price: stock.price,
      quantity: 1,
      metadata: {
        item_id: itemId,
        product_name: cartResult.productName,
        error: cartResult.error,
        stock_check: stock,
      },
    }).catch(() => {});

    return NextResponse.json(cartResult);
  }

  if (action === "cart-all-priority") {
    const priorityProducts = WALMART_DROPS_2026_06_29.filter((p) => p.auto_buy);
    const results = [];

    for (const product of priorityProducts) {
      const stock = await checkWalmartStock(product.item_id);

      if (stock.available) {
        // Only buy from Walmart.com seller, not third-party scalpers
        if (stock.sellerName && stock.sellerName !== "Walmart.com") {
          results.push({
            name: product.product_name,
            item_id: product.item_id,
            success: false,
            reason: `Third-party seller: ${stock.sellerName} (only buying from Walmart.com)`,
          });
          continue;
        }

        if (stock.price && stock.price > product.max_price) {
          results.push({
            name: product.product_name,
            item_id: product.item_id,
            success: false,
            reason: `Price $${stock.price} exceeds max $${product.max_price}`,
          });
          continue;
        }

        const cartResult = await addToWalmartCart(product.item_id, 1);
        results.push({
          name: product.product_name,
          item_id: product.item_id,
          success: cartResult.success,
          price: stock.price,
          error: cartResult.error,
        });

        // SMS alert
        await sendDropAlert(
          "Walmart",
          product.product_name,
          stock.price,
          product.product_url,
          cartResult.success ? "carted" : "failed"
        );

        await supabase.from("drop_purchases").insert({
          retailer: "walmart",
          status: cartResult.success ? "carted" : "failed",
          purchase_price: stock.price,
          quantity: 1,
          metadata: {
            item_id: product.item_id,
            product_name: product.product_name,
            auto_buy: true,
            drop_date: "2026-06-29",
          },
        }).catch(() => {});

        await new Promise((r) => setTimeout(r, 500));
      } else {
        results.push({
          name: product.product_name,
          item_id: product.item_id,
          success: false,
          reason: "Not in stock",
        });
      }
    }

    return NextResponse.json({
      retailer: "walmart",
      timestamp: new Date().toISOString(),
      attempted: results.length,
      carted: results.filter((r) => r.success).length,
      results,
    });
  }

  return NextResponse.json({ error: "Invalid action. Use: check, cart, cart-all-priority" }, { status: 400 });
}
