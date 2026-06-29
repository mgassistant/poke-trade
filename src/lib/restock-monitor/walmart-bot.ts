/**
 * Walmart Stock Monitor & Auto-Cart Bot
 * 
 * Uses Walmart's internal APIs to:
 * 1. Check stock availability via Walmart's product data endpoint
 * 2. Add to cart via Walmart's cart API
 * 
 * REQUIRES: Walmart account cookies for auto-cart
 * Store cookies in env: WALMART_SESSION_COOKIES
 */

interface WalmartStockResult {
  available: boolean;
  fulfillment: "SHIP" | "PICKUP" | "NONE";
  price?: number;
  itemId: string;
  productName?: string;
  error?: string;
  sellerId?: string;
  sellerName?: string;
}

interface WalmartCartResult {
  success: boolean;
  itemId: string;
  productName: string;
  price?: number;
  cartUrl?: string;
  error?: string;
}

/**
 * Check Walmart product availability
 * Uses their BE/product data endpoint which is less restrictive than the main site
 */
export async function checkWalmartStock(itemId: string, zipCode = "92562"): Promise<WalmartStockResult> {
  try {
    // Walmart's product data API (used by their frontend)
    const url = `https://www.walmart.com/orchestra/snb/graphql/GetAllProductOffers`;
    
    const graphqlBody = {
      query: `query GetAllProductOffers($itemId: String!, $zipCode: String) {
        product(itemId: $itemId) {
          name
          usItemId
          availabilityStatus
          priceInfo {
            currentPrice {
              price
            }
          }
          fulfillmentOptions(zipCode: $zipCode) {
            type
            availabilityStatus
          }
          sellerInfo {
            sellerId
            sellerName
          }
        }
      }`,
      variables: { itemId, zipCode }
    };

    // Try the Tempo API first (more reliable)
    const tempoUrl = `https://www.walmart.com/orchestra/home/graphql/GetProductDetail?itemId=${itemId}`;
    
    const res = await fetch(tempoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": `https://www.walmart.com/ip/${itemId}`,
        "Origin": "https://www.walmart.com",
        "x-o-ccm": "server",
        "x-o-gql-query": "query GetProductDetail",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 403 || res.status === 412) {
      // Walmart blocked direct API — fall back to scraping availability from product page
      return await checkWalmartStockFallback(itemId);
    }

    if (!res.ok) {
      return { available: false, fulfillment: "NONE", itemId, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const product = data?.data?.product;

    if (!product) {
      return await checkWalmartStockFallback(itemId);
    }

    const isAvailable = product.availabilityStatus === "IN_STOCK" || 
                        product.availabilityStatus === "LIMITED_STOCK";
    const price = product.priceInfo?.currentPrice?.price;
    const isWalmartSeller = product.sellerInfo?.sellerName === "Walmart.com";

    return {
      available: isAvailable,
      fulfillment: isAvailable ? "SHIP" : "NONE",
      price,
      itemId,
      productName: product.name,
      sellerId: product.sellerInfo?.sellerId,
      sellerName: product.sellerInfo?.sellerName,
    };
  } catch (e: any) {
    // Try fallback on any error
    return await checkWalmartStockFallback(itemId);
  }
}

/**
 * Fallback: Check availability by fetching the product page and parsing JSON-LD
 */
async function checkWalmartStockFallback(itemId: string): Promise<WalmartStockResult> {
  try {
    const res = await fetch(`https://www.walmart.com/ip/${itemId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { available: false, fulfillment: "NONE", itemId, error: `Fallback HTTP ${res.status}` };
    }

    const html = await res.text();

    // Extract JSON-LD product data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        const offers = jsonLd.offers || jsonLd.mainEntity?.offers || {};
        const availability = offers.availability || "";
        const isAvailable = availability.includes("InStock") || availability.includes("LimitedAvailability");
        
        return {
          available: isAvailable,
          fulfillment: isAvailable ? "SHIP" : "NONE",
          price: offers.price ? parseFloat(offers.price) : undefined,
          itemId,
          productName: jsonLd.name,
        };
      } catch {}
    }

    // Fallback: check for "Add to cart" button presence
    const hasAddToCart = html.includes("Add to cart") && !html.includes("Out of stock");
    const priceMatch = html.match(/"currentPrice":\s*\{"price":\s*([\d.]+)/);

    return {
      available: hasAddToCart,
      fulfillment: hasAddToCart ? "SHIP" : "NONE",
      price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
      itemId,
    };
  } catch (e: any) {
    return { available: false, fulfillment: "NONE", itemId, error: `Fallback error: ${e.message}` };
  }
}

/**
 * Add item to Walmart cart via their API
 * Requires authenticated session cookies
 */
export async function addToWalmartCart(
  itemId: string,
  quantity = 1,
  sessionCookies?: string
): Promise<WalmartCartResult> {
  const cookies = sessionCookies || process.env.WALMART_SESSION_COOKIES;

  if (!cookies) {
    return {
      success: false,
      itemId,
      productName: "",
      error: "No Walmart session cookies. Log into walmart.com and export cookies.",
    };
  }

  try {
    // Walmart's add-to-cart endpoint
    const url = "https://www.walmart.com/api/v1/cart/items";

    const payload = {
      items: [{
        id: itemId,
        quantity: quantity,
        offerId: itemId,
      }],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Cookie": cookies,
        "Referer": `https://www.walmart.com/ip/${itemId}`,
        "Origin": "https://www.walmart.com",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      // Try alternate cart endpoint
      const altUrl = "https://www.walmart.com/orchestra/cartservice/graphql/AddItemToCart";
      const altPayload = {
        query: `mutation AddItemToCart($input: AddItemInput!) {
          addItemToCart(input: $input) {
            id
            items { id name quantity unitPrice }
          }
        }`,
        variables: {
          input: {
            itemId,
            quantity,
            offerId: itemId,
          }
        }
      };

      const altRes = await fetch(altUrl, {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Cookie": cookies,
          "Referer": `https://www.walmart.com/ip/${itemId}`,
          "Origin": "https://www.walmart.com",
        },
        body: JSON.stringify(altPayload),
        signal: AbortSignal.timeout(15000),
      });

      if (!altRes.ok) {
        const errBody = await altRes.text();
        return {
          success: false,
          itemId,
          productName: "",
          error: `Cart API ${altRes.status}: ${errBody.slice(0, 200)}`,
        };
      }

      const altData = await altRes.json();
      return {
        success: true,
        itemId,
        productName: altData?.data?.addItemToCart?.items?.[0]?.name || itemId,
        cartUrl: "https://www.walmart.com/cart",
      };
    }

    const data = await res.json();
    return {
      success: true,
      itemId,
      productName: data?.items?.[0]?.name || itemId,
      cartUrl: "https://www.walmart.com/cart",
    };
  } catch (e: any) {
    return {
      success: false,
      itemId,
      productName: "",
      error: e.message,
    };
  }
}
