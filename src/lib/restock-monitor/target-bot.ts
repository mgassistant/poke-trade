/**
 * Target Auto-Cart Bot
 * 
 * Uses direct Target API calls (no browser needed) to:
 * 1. Check stock availability via Target's fulfillment API
 * 2. Add to cart via Target's cart API
 * 
 * REQUIRES: Target account cookies (logged in session)
 * Store cookies in env: TARGET_SESSION_COOKIES
 * 
 * NOTE: This is for personal use only. Target TOS may prohibit automated purchasing.
 * Use at your own discretion.
 */

const TARGET_API_KEY = "ff457966e64d5e877fdbad070f276d18ecec4a01"; // Target public API key (from their frontend)

interface TargetCartResult {
  success: boolean;
  tcin: string;
  productName: string;
  price?: number;
  cartUrl?: string;
  error?: string;
}

interface TargetStockResult {
  available: boolean;
  fulfillment: "SHIP" | "PICKUP" | "NONE";
  price?: number;
  tcin: string;
  error?: string;
}

/**
 * Check Target product availability via their fulfillment API
 */
export async function checkTargetStock(tcin: string, zipCode = "90001"): Promise<TargetStockResult> {
  try {
    // Target's fulfillment endpoint
    const url = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1?key=${TARGET_API_KEY}&tcin=${tcin}&store_id=1&has_store_positions_store_id=1&zip=${zipCode}&state=CA&latitude=33.9425&longitude=-118.2551&scheduled_delivery_store_id=1&pricing_store_id=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": `https://www.target.com/p/-/A-${tcin}`,
        "Origin": "https://www.target.com",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { available: false, fulfillment: "NONE", tcin, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const product = data?.data?.product;
    const fulfillment = product?.fulfillment;

    // Check shipping availability
    const shippingOptions = fulfillment?.shipping_options;
    const isShippable = shippingOptions?.availability_status === "IN_STOCK" ||
      shippingOptions?.availability_status === "LIMITED_STOCK";

    // Check store pickup
    const storeOptions = fulfillment?.store_options;
    const isPickupAvailable = storeOptions?.[0]?.order_pickup?.availability_status === "IN_STOCK";

    // Get price
    const price = product?.price?.formatted_current_price_is_range === false
      ? product.price.current_retail
      : product?.price?.current_retail_min;

    return {
      available: isShippable || isPickupAvailable,
      fulfillment: isShippable ? "SHIP" : isPickupAvailable ? "PICKUP" : "NONE",
      price,
      tcin,
    };
  } catch (e: any) {
    return { available: false, fulfillment: "NONE", tcin, error: e.message };
  }
}

/**
 * Add item to Target cart via their API
 * Requires authenticated session cookies
 */
export async function addToTargetCart(
  tcin: string,
  quantity = 1,
  sessionCookies?: string
): Promise<TargetCartResult> {
  const cookies = sessionCookies || process.env.TARGET_SESSION_COOKIES;

  if (!cookies) {
    return {
      success: false,
      tcin,
      productName: "",
      error: "No Target session cookies configured. Log into target.com and export cookies.",
    };
  }

  try {
    // Target's add-to-cart API
    const url = "https://carts.target.com/web_checkouts/v1/cart_items";

    const payload = {
      cart_type: "REGULAR",
      channel_id: 10,
      shopping_context: "DIGITAL",
      cart_item: {
        tcin: tcin,
        quantity: quantity,
        item_channel_id: 10,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Cookie": cookies,
        "Referer": `https://www.target.com/p/-/A-${tcin}`,
        "Origin": "https://www.target.com",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return {
        success: false,
        tcin,
        productName: "",
        error: `Cart API returned ${res.status}: ${errorBody.slice(0, 200)}`,
      };
    }

    const data = await res.json();
    const cartItem = data?.cart_items?.[0];

    return {
      success: true,
      tcin,
      productName: cartItem?.item_attributes?.description || tcin,
      price: cartItem?.unit_price,
      cartUrl: "https://www.target.com/cart",
    };
  } catch (e: any) {
    return {
      success: false,
      tcin,
      productName: "",
      error: e.message,
    };
  }
}

/**
 * Monitor + auto-cart flow for a Target drop
 * Checks stock every N seconds, adds to cart when available
 */
export async function monitorAndCart(
  products: Array<{ tcin: string; name: string; maxPrice: number; quantity: number }>,
  options: {
    checkIntervalMs?: number;
    maxAttempts?: number;
    sessionCookies?: string;
    onStockFound?: (tcin: string, name: string) => void;
    onCartSuccess?: (tcin: string, name: string) => void;
    onCartFail?: (tcin: string, name: string, error: string) => void;
  } = {}
): Promise<TargetCartResult[]> {
  const {
    checkIntervalMs = 5000,
    maxAttempts = 360, // 30 minutes at 5s intervals
    sessionCookies,
  } = options;

  const results: TargetCartResult[] = [];
  const carted = new Set<string>(); // Track what's already in cart
  let attempts = 0;

  console.log(`🎯 Target Drop Monitor started — ${products.length} products, checking every ${checkIntervalMs / 1000}s`);

  while (attempts < maxAttempts && carted.size < products.length) {
    attempts++;
    console.log(`\n[Attempt ${attempts}/${maxAttempts}] Checking ${products.length - carted.size} remaining products...`);

    for (const product of products) {
      if (carted.has(product.tcin)) continue;

      const stock = await checkTargetStock(product.tcin);

      if (stock.available) {
        console.log(`🟢 IN STOCK: ${product.name} ($${stock.price || "?"}) — ${stock.fulfillment}`);
        options.onStockFound?.(product.tcin, product.name);

        // Check price limit
        if (stock.price && stock.price > product.maxPrice) {
          console.log(`⚠️ Price $${stock.price} exceeds max $${product.maxPrice} — skipping`);
          continue;
        }

        // Add to cart
        const cartResult = await addToTargetCart(product.tcin, product.quantity, sessionCookies);
        results.push({ ...cartResult, productName: product.name });

        if (cartResult.success) {
          carted.add(product.tcin);
          console.log(`🛒 CARTED: ${product.name} — ${cartResult.cartUrl}`);
          options.onCartSuccess?.(product.tcin, product.name);
        } else {
          console.log(`❌ Cart failed: ${product.name} — ${cartResult.error}`);
          options.onCartFail?.(product.tcin, product.name, cartResult.error || "Unknown");
        }
      } else {
        if (stock.error) {
          console.log(`⚠️ ${product.name}: ${stock.error}`);
        }
      }

      // Small delay between checks to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    }

    // Wait before next cycle
    if (carted.size < products.length) {
      await new Promise((r) => setTimeout(r, checkIntervalMs));
    }
  }

  console.log(`\n🏁 Monitor complete — ${carted.size}/${products.length} products carted`);
  return results;
}
