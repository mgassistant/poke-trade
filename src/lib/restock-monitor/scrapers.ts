/**
 * Retailer-specific stock check scrapers
 * Each returns { inStock, price, quantity?, error? }
 */

export interface StockCheckResult {
  inStock: boolean;
  price?: number;
  quantity?: number;
  error?: string;
  responseMs: number;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/html',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Pokemon Center (Shopify-based)
 * Check product availability via their API
 */
export async function checkPokemonCenter(productUrl: string, sku: string): Promise<StockCheckResult> {
  const start = Date.now();
  try {
    // Pokemon Center doesn't support .json — go straight to HTML
    const res = await fetch(productUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { inStock: false, error: `HTTP ${res.status}`, responseMs: Date.now() - start };
    }

    const html = await res.text();

    // Check multiple indicators for stock availability
    const inStock = (
      html.includes('add-to-cart') ||
      html.includes('Add to Cart') ||
      html.includes('"available":true') ||
      html.includes('addToCartButton') ||
      html.includes('"inStock":true')
    ) && !html.includes('Out of Stock') && !html.includes('Sold Out');

    // Extract price
    const priceMatch = html.match(/"price":\s*"?(\d+\.?\d*)/) ||
      html.match(/data-price="(\d+\.?\d*)/) ||
      html.match(/\$(\d+\.\d{2})/);

    return {
      inStock,
      price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
      responseMs: Date.now() - start,
    };
  } catch (e: any) {
    return { inStock: false, error: e.message, responseMs: Date.now() - start };
  }
}

/**
 * Target (Redsky API)
 * Uses their fulfillment API with store/ship availability
 */
export async function checkTarget(productUrl: string, sku: string): Promise<StockCheckResult> {
  const start = Date.now();
  try {
    // Extract TCIN from URL (the A-XXXXXXXX part)
    const tcinMatch = sku.match(/A-?(\d+)/) || productUrl.match(/A-(\d+)/);
    const tcin = tcinMatch?.[1] || sku.replace('A-', '');

    if (!tcin) return { inStock: false, error: 'No TCIN found', responseMs: Date.now() - start };

    // Target's fulfillment API
    const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${tcin}&store_id=911&has_store_positions_store_id=911&scheduled_delivery_store_id=911&pricing_store_id=911`;

    const res = await fetch(apiUrl, {
      headers: { ...HEADERS, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { inStock: false, error: `API ${res.status}`, responseMs: Date.now() - start };

    const data = await res.json();
    const product = data.data?.product;
    const fulfillment = product?.fulfillment;

    // Check shipping availability
    const shippingAvailable = fulfillment?.shipping_options?.availability_status === 'IN_STOCK';
    const pickupAvailable = fulfillment?.store_options?.[0]?.order_pickup?.availability_status === 'IN_STOCK';

    const price = product?.price?.formatted_current_price;
    const priceNum = price ? parseFloat(price.replace(/[^0-9.]/g, '')) : undefined;

    return {
      inStock: shippingAvailable || pickupAvailable,
      price: priceNum,
      responseMs: Date.now() - start,
    };
  } catch (e: any) {
    return { inStock: false, error: e.message, responseMs: Date.now() - start };
  }
}

/**
 * Walmart (API)
 */
export async function checkWalmart(productUrl: string, sku: string): Promise<StockCheckResult> {
  const start = Date.now();
  try {
    // Extract item ID from URL
    const itemId = sku || productUrl.match(/\/(\d{9,})/)?.[1] || '';
    if (!itemId) return { inStock: false, error: 'No item ID', responseMs: Date.now() - start };

    const apiUrl = `https://www.walmart.com/terra-firma/item/${itemId}`;
    const res = await fetch(apiUrl, {
      headers: { ...HEADERS, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // Fallback to HTML check
      const htmlRes = await fetch(productUrl, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      const html = await htmlRes.text();
      const inStock = html.includes('"availabilityStatus":"IN_STOCK"') || html.includes('Add to cart');
      return { inStock, responseMs: Date.now() - start };
    }

    const data = await res.json();
    const inStock = data.payload?.selected?.status === 'IN_STOCK' ||
      data.payload?.product?.availabilityStatus === 'IN_STOCK';
    const price = data.payload?.selected?.priceInfo?.currentPrice?.price;

    return { inStock, price, responseMs: Date.now() - start };
  } catch (e: any) {
    return { inStock: false, error: e.message, responseMs: Date.now() - start };
  }
}

/**
 * Best Buy (API)
 */
export async function checkBestBuy(productUrl: string, sku: string): Promise<StockCheckResult> {
  const start = Date.now();
  try {
    const skuId = sku || productUrl.match(/\/(\d{7})\.p/)?.[1] || '';
    if (!skuId) return { inStock: false, error: 'No SKU', responseMs: Date.now() - start };

    // Best Buy fulfillment check
    const apiUrl = `https://www.bestbuy.com/api/tcfb/model.json?paths=%5B%5B%22shop%22%2C%22buttonstate%22%2C%22v5%22%2C%22item%22%2C%22skus%22%2C${skuId}%2C%22conditions%22%2C%22NONE%22%2C%22destinationZipCode%22%2C%2290001%22%2C%22storeId%22%2C%22%20%22%2C%22context%22%2C%22cyp%22%2C%22addAll%22%2C%22false%22%5D%5D`;

    const res = await fetch(apiUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // HTML fallback
      const htmlRes = await fetch(productUrl, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      const html = await htmlRes.text();
      const inStock = html.includes('Add to Cart') && !html.includes('Sold Out');
      return { inStock, responseMs: Date.now() - start };
    }

    const data = await res.json();
    const buttonState = data.jsonGraph?.shop?.buttonstate?.v5?.item?.skus?.[skuId];
    const inStock = buttonState?.conditions?.NONE?.destinationZipCode?.['90001']?.storeId?.[' ']?.context?.cyp?.addAll?.false?.value?.buttonState === 'ADD_TO_CART';

    return { inStock, responseMs: Date.now() - start };
  } catch (e: any) {
    return { inStock: false, error: e.message, responseMs: Date.now() - start };
  }
}

/**
 * GameStop
 */
export async function checkGameStop(productUrl: string, sku: string): Promise<StockCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(productUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    const inStock = (html.includes('Add to Cart') || html.includes('addToCart')) &&
      !html.includes('Not Available') && !html.includes('unavailable');
    const priceMatch = html.match(/\$(\d+\.?\d*)/);

    return {
      inStock,
      price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
      responseMs: Date.now() - start,
    };
  } catch (e: any) {
    return { inStock: false, error: e.message, responseMs: Date.now() - start };
  }
}

/**
 * TCGPlayer (for market price reference)
 */
export async function checkTCGPlayer(productUrl: string, sku: string): Promise<StockCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(productUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    const inStock = html.includes('Add to Cart') || html.includes('listings-container');
    const priceMatch = html.match(/market-price[^>]*>\$(\d+\.?\d*)/i) ||
      html.match(/\$(\d+\.?\d*)/);

    return {
      inStock,
      price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
      responseMs: Date.now() - start,
    };
  } catch (e: any) {
    return { inStock: false, error: e.message, responseMs: Date.now() - start };
  }
}

/**
 * Route to correct scraper based on retailer
 */
export async function checkStock(retailer: string, productUrl: string, sku: string): Promise<StockCheckResult> {
  switch (retailer) {
    case 'pokemon_center': return checkPokemonCenter(productUrl, sku);
    case 'target': return checkTarget(productUrl, sku);
    case 'walmart': return checkWalmart(productUrl, sku);
    case 'bestbuy': return checkBestBuy(productUrl, sku);
    case 'gamestop': return checkGameStop(productUrl, sku);
    case 'tcgplayer': return checkTCGPlayer(productUrl, sku);
    default: return { inStock: false, error: `Unknown retailer: ${retailer}`, responseMs: 0 };
  }
}
