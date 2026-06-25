import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COOLDOWN_SECONDS = 60; // 1 minute between purchases

export interface ScalperCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user has exceeded max_qty_per_member for a product
 */
export async function checkPurchaseLimit(
  userId: string,
  productId: string
): Promise<ScalperCheckResult> {
  const { data: product } = await supabase
    .from("shop_products")
    .select("max_qty_per_member, title")
    .eq("id", productId)
    .single();

  if (!product) return { allowed: false, reason: "Product not found" };

  const { data: orderItems } = await supabase
    .from("shop_order_items")
    .select("quantity, order_id")
    .eq("product_id", productId);

  if (!orderItems) return { allowed: true };

  // Get orders belonging to this user that are not canceled/refunded
  const orderIds = orderItems.map((i) => i.order_id);
  if (orderIds.length === 0) return { allowed: true };

  const { data: userOrders } = await supabase
    .from("shop_orders")
    .select("id")
    .eq("user_id", userId)
    .in("id", orderIds)
    .not("status", "in", "(canceled,refunded)");

  if (!userOrders || userOrders.length === 0) return { allowed: true };

  const userOrderIds = new Set(userOrders.map((o) => o.id));
  const totalPurchased = orderItems
    .filter((i) => userOrderIds.has(i.order_id))
    .reduce((sum, i) => sum + i.quantity, 0);

  if (totalPurchased >= (product.max_qty_per_member ?? 1)) {
    return {
      allowed: false,
      reason: `Purchase limit of ${product.max_qty_per_member} reached for "${product.title}"`,
    };
  }

  return { allowed: true };
}

/**
 * Check household limit by shipping address
 */
export async function checkHouseholdLimit(
  shippingAddress: Record<string, unknown>,
  productId: string
): Promise<ScalperCheckResult> {
  const { data: product } = await supabase
    .from("shop_products")
    .select("max_qty_per_household, title")
    .eq("id", productId)
    .single();

  if (!product) return { allowed: false, reason: "Product not found" };

  const addressKey = normalizeAddress(shippingAddress);

  // Find orders with similar shipping address
  const { data: orders } = await supabase
    .from("shop_orders")
    .select("id, shipping_address")
    .not("status", "in", "(canceled,refunded)");

  if (!orders) return { allowed: true };

  const matchingOrderIds = orders
    .filter((o) => normalizeAddress(o.shipping_address as Record<string, unknown>) === addressKey)
    .map((o) => o.id);

  if (matchingOrderIds.length === 0) return { allowed: true };

  const { data: items } = await supabase
    .from("shop_order_items")
    .select("quantity")
    .eq("product_id", productId)
    .in("order_id", matchingOrderIds);

  const totalHousehold = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);

  if (totalHousehold >= (product.max_qty_per_household ?? 2)) {
    return {
      allowed: false,
      reason: `Household limit of ${product.max_qty_per_household} reached for "${product.title}"`,
    };
  }

  return { allowed: true };
}

/**
 * Check cooldown between purchases
 */
export async function checkCooldown(userId: string): Promise<ScalperCheckResult> {
  const { data: recentOrder } = await supabase
    .from("shop_orders")
    .select("created_at")
    .eq("user_id", userId)
    .not("status", "in", "(canceled,refunded)")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!recentOrder) return { allowed: true };

  const lastOrderTime = new Date(recentOrder.created_at).getTime();
  const now = Date.now();
  const elapsed = (now - lastOrderTime) / 1000;

  if (elapsed < COOLDOWN_SECONDS) {
    const waitSec = Math.ceil(COOLDOWN_SECONDS - elapsed);
    return {
      allowed: false,
      reason: `Please wait ${waitSec} seconds before placing another order`,
    };
  }

  return { allowed: true };
}

/**
 * Flag an order for manual review
 */
export async function flagSuspiciousOrder(
  orderId: string,
  reason: string
): Promise<void> {
  await supabase
    .from("shop_orders")
    .update({
      status: "manual_review",
      fraud_status: "flagged",
      manual_review_reason: reason,
    })
    .eq("id", orderId);
}

function normalizeAddress(address: Record<string, unknown> | null): string {
  if (!address) return "";
  const parts = [
    String(address.line1 ?? "").toLowerCase().trim(),
    String(address.city ?? "").toLowerCase().trim(),
    String(address.state ?? "").toLowerCase().trim(),
    String(address.postal_code ?? "").toLowerCase().trim(),
  ];
  return parts.join("|");
}
