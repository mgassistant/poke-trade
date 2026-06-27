/**
 * Restock Monitor Engine
 * Checks all active products on a rotating schedule and fires alerts on state changes
 */

import { createClient } from '@supabase/supabase-js';
import { checkStock, StockCheckResult } from './scrapers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MonitorProduct {
  id: string;
  retailer: string;
  product_name: string;
  product_url: string;
  sku: string;
  in_stock: boolean;
  current_price: number | null;
  auto_buy_enabled: boolean;
  auto_buy_max_price: number | null;
  auto_buy_quantity: number;
  priority: number;
}

export interface MonitorResult {
  checked: number;
  restocks: number;
  priceDrops: number;
  errors: number;
  autoBuyTriggered: number;
  details: Array<{
    product: string;
    retailer: string;
    wasInStock: boolean;
    nowInStock: boolean;
    oldPrice?: number;
    newPrice?: number;
    error?: string;
  }>;
}

/**
 * Run a single monitoring cycle — checks all active products
 */
export async function runMonitorCycle(): Promise<MonitorResult> {
  const result: MonitorResult = {
    checked: 0, restocks: 0, priceDrops: 0, errors: 0, autoBuyTriggered: 0, details: [],
  };

  // Get all active products, ordered by priority (1 = highest)
  const { data: products, error } = await supabase
    .from('drop_products')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: true })
    .order('last_checked_at', { ascending: true, nullsFirst: true });

  if (error || !products) {
    console.error('[Monitor] Failed to load products:', error);
    return result;
  }

  for (const product of products as MonitorProduct[]) {
    try {
      const check = await checkStock(product.retailer, product.product_url, product.sku);
      result.checked++;

      // Log the check
      await supabase.from('drop_stock_checks').insert({
        product_id: product.id,
        in_stock: check.inStock,
        price: check.price || null,
        stock_quantity: check.quantity || null,
        response_ms: check.responseMs,
        error: check.error || null,
      });

      // Update product state
      const updateData: Record<string, any> = {
        last_checked_at: new Date().toISOString(),
      };

      if (check.price) updateData.current_price = check.price;

      // Detect state changes
      const wasInStock = product.in_stock;
      const nowInStock = check.inStock;

      if (nowInStock !== wasInStock) {
        updateData.in_stock = nowInStock;
        if (nowInStock) {
          updateData.last_in_stock_at = new Date().toISOString();
        }
      }

      await supabase.from('drop_products').update(updateData).eq('id', product.id);

      // ═══ RESTOCK DETECTED ═══
      if (!wasInStock && nowInStock) {
        result.restocks++;
        console.log(`🟢 RESTOCK: ${product.product_name} @ ${product.retailer} — $${check.price || 'N/A'}`);

        // Create alert
        await supabase.from('drop_alerts').insert({
          product_id: product.id,
          alert_type: 'restock',
          previous_state: { in_stock: false, price: product.current_price },
          new_state: { in_stock: true, price: check.price },
        });

        // Notify watchlist subscribers
        await notifyWatchlistUsers(product.id, 'restock', product.product_name, product.retailer, check.price);

        // Auto-buy if enabled and price is within limit
        if (product.auto_buy_enabled) {
          const maxPrice = product.auto_buy_max_price || Infinity;
          const currentPrice = check.price || product.current_price || 0;
          if (currentPrice <= maxPrice) {
            result.autoBuyTriggered++;
            await triggerAutoBuy(product, check);
          }
        }
      }

      // ═══ WENT OUT OF STOCK ═══
      if (wasInStock && !nowInStock) {
        await supabase.from('drop_alerts').insert({
          product_id: product.id,
          alert_type: 'back_oos',
          previous_state: { in_stock: true, price: product.current_price },
          new_state: { in_stock: false },
        });
      }

      // ═══ PRICE DROP ═══
      if (check.price && product.current_price && check.price < product.current_price * 0.95) {
        result.priceDrops++;
        await supabase.from('drop_alerts').insert({
          product_id: product.id,
          alert_type: 'price_drop',
          previous_state: { price: product.current_price },
          new_state: { price: check.price },
        });

        await notifyWatchlistUsers(product.id, 'price_drop', product.product_name, product.retailer, check.price);
      }

      result.details.push({
        product: product.product_name,
        retailer: product.retailer,
        wasInStock,
        nowInStock,
        oldPrice: product.current_price || undefined,
        newPrice: check.price,
        error: check.error,
      });

      if (check.error) result.errors++;

      // Small delay between checks to avoid rate limiting
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

    } catch (e: any) {
      result.errors++;
      result.details.push({
        product: product.product_name,
        retailer: product.retailer,
        wasInStock: product.in_stock,
        nowInStock: product.in_stock,
        error: e.message,
      });
    }
  }

  return result;
}

/**
 * Notify users on the watchlist for a product
 */
async function notifyWatchlistUsers(
  productId: string,
  alertType: 'restock' | 'price_drop',
  productName: string,
  retailer: string,
  price?: number
) {
  const { data: watchers } = await supabase
    .from('drop_watchlist')
    .select('user_id, target_price')
    .eq('product_id', productId)
    .eq(alertType === 'restock' ? 'notify_restock' : 'notify_price_drop', true);

  if (!watchers?.length) return;

  // Get user emails for notification
  const userIds = watchers.map(w => w.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', userIds);

  if (!profiles?.length) return;

  // For now, log notifications — in production, send push/email/SMS
  for (const profile of profiles) {
    const watcher = watchers.find(w => w.user_id === profile.id);

    // For price drops, check if it meets target price
    if (alertType === 'price_drop' && watcher?.target_price && price && price > watcher.target_price) {
      continue; // Price hasn't dropped enough for this user
    }

    console.log(`📩 Notify ${profile.display_name || profile.email}: ${alertType} — ${productName} @ ${retailer} ($${price || 'N/A'})`);

    // TODO: Integrate with push notifications, email (Resend), SMS
    // For now, create an in-app notification record
    await supabase.from('drop_alerts').update({
      notified: true,
      notification_count: 1,
    }).eq('product_id', productId).eq('alert_type', alertType).order('created_at', { ascending: false }).limit(1);
  }
}

/**
 * Trigger auto-buy for a restocked product
 */
async function triggerAutoBuy(product: MonitorProduct, check: StockCheckResult) {
  console.log(`🛒 AUTO-BUY TRIGGERED: ${product.product_name} @ ${product.retailer} — $${check.price}`);

  // Create purchase record
  const { data: purchase } = await supabase.from('drop_purchases').insert({
    product_id: product.id,
    retailer: product.retailer,
    status: 'pending',
    purchase_price: check.price,
    quantity: product.auto_buy_quantity,
    metadata: {
      product_name: product.product_name,
      product_url: product.product_url,
      triggered_at: new Date().toISOString(),
    },
  }).select().single();

  if (!purchase) return;

  // TODO: Phase 2 — Playwright auto-checkout
  // For now, just log and send alert for manual purchase
  console.log(`⚡ Purchase ID: ${purchase.id} — needs manual checkout or Phase 2 automation`);

  // Update status to indicate manual action needed
  await supabase.from('drop_purchases').update({
    status: 'manual_review',
    metadata: {
      ...purchase.metadata,
      note: 'Auto-checkout not yet implemented — manual purchase required',
    },
  }).eq('id', purchase.id);
}
