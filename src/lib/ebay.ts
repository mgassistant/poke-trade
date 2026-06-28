/**
 * eBay Browse API Integration for Poke-Trade
 * Uses Client Credentials (app-level) OAuth — no user login needed
 * Provides: active listings + recently sold Pokémon cards
 */

interface EbayToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: EbayToken | null = null;

const EBAY_APP_ID = process.env.EBAY_APP_ID || "";
const EBAY_CERT_ID = process.env.EBAY_CERT_ID || "";

// ============================================================
// OAuth 2.0 — Client Credentials Grant (application token)
// ============================================================
async function getAppToken(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 300_000) {
    return cachedToken.access_token;
  }

  const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[eBay OAuth] Token fetch failed:", res.status, err);
    throw new Error(`eBay OAuth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.access_token;
}

// ============================================================
// Browse API — Search active listings
// ============================================================
export interface EbayListing {
  title: string;
  price: number;
  currency: string;
  condition: string;
  imageUrl: string | null;
  itemUrl: string;
  itemId: string;
  seller: string;
  sellerFeedbackScore: number;
  listingType: string; // FIXED_PRICE or AUCTION
  shippingCost: number | null;
  totalPrice: number;
  endDate: string | null;
}

export interface EbaySearchResult {
  listings: EbayListing[];
  totalResults: number;
  averagePrice: number | null;
  medianPrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
}

export async function searchEbayListings(
  cardName: string,
  options: {
    limit?: number;
    sort?: "price" | "-price" | "newlyListed" | "endingSoonest";
    condition?: "NEW" | "USED" | "UNSPECIFIED";
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<EbaySearchResult> {
  const {
    limit = 25,
    sort = "newlyListed",
    condition,
    minPrice,
    maxPrice,
  } = options;

  try {
    const token = await getAppToken();

    // Build query — target Pokémon TCG category (183454)
    const query = encodeURIComponent(cardName);
    let url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&category_ids=183454&limit=${limit}&sort=${sort}`;

    // Filters
    const filters: string[] = [];
    if (condition) filters.push(`conditionIds:{${condition === "NEW" ? "1000" : "3000"}}`);
    if (minPrice) filters.push(`price:[${minPrice}..],priceCurrency:USD`);
    if (maxPrice) filters.push(`price:[..${maxPrice}],priceCurrency:USD`);
    if (filters.length > 0) url += `&filter=${filters.join(",")}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        "X-EBAY-C-ENDUSERCTX": "affiliateCampaignId=poke-trade",
      },
      next: { revalidate: 300 }, // Cache 5 min
    });

    if (!res.ok) {
      console.error("[eBay Browse] Search failed:", res.status, await res.text());
      return emptyResult();
    }

    const data = await res.json();
    const items = data.itemSummaries || [];

    const listings: EbayListing[] = items.map((item: Record<string, unknown>) => {
      const price = parseFloat((item.price as Record<string, string>)?.value || "0");
      const shippingRaw = item.shippingOptions as Record<string, unknown>[] | undefined;
      const shippingCost = shippingRaw?.[0]
        ? parseFloat((shippingRaw[0].shippingCost as Record<string, string>)?.value || "0")
        : null;

      return {
        title: item.title as string,
        price,
        currency: (item.price as Record<string, string>)?.currency || "USD",
        condition: (item.condition as string) || "Not Specified",
        imageUrl: ((item.image as Record<string, string>)?.imageUrl) || null,
        itemUrl: item.itemWebUrl as string,
        itemId: item.itemId as string,
        seller: ((item.seller as Record<string, unknown>)?.username as string) || "unknown",
        sellerFeedbackScore: ((item.seller as Record<string, unknown>)?.feedbackScore as number) || 0,
        listingType: (item.buyingOptions as string[])?.includes("FIXED_PRICE") ? "FIXED_PRICE" : "AUCTION",
        shippingCost,
        totalPrice: price + (shippingCost || 0),
        endDate: (item.itemEndDate as string) || null,
      };
    });

    // Calculate stats
    const prices = listings.map((l) => l.totalPrice).filter((p) => p > 0).sort((a, b) => a - b);
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;

    return {
      listings,
      totalResults: data.total || listings.length,
      averagePrice,
      medianPrice,
      lowestPrice: prices[0] || null,
      highestPrice: prices[prices.length - 1] || null,
    };
  } catch (err) {
    console.error("[eBay Browse] Error:", err);
    return emptyResult();
  }
}

// ============================================================
// Price source adapter — plugs into price-sources.ts
// ============================================================
import type { PriceSource } from "./price-sources";

export async function fetchEbayPrices(cardName: string): Promise<PriceSource[]> {
  try {
    const result = await searchEbayListings(cardName, { limit: 50, sort: "newlyListed" });

    if (result.listings.length === 0) return [];

    return [
      {
        source: "ebay.com",
        platform: "eBay Active Listings",
        icon: "🛒",
        low: result.lowestPrice,
        mid: result.medianPrice,
        high: result.highestPrice,
        market: result.averagePrice,
        lastUpdated: new Date().toISOString(),
        url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cardName + " pokemon card")}&_sacat=183454`,
        condition: "Mixed",
      },
    ];
  } catch {
    return [];
  }
}

function emptyResult(): EbaySearchResult {
  return {
    listings: [],
    totalResults: 0,
    averagePrice: null,
    medianPrice: null,
    lowestPrice: null,
    highestPrice: null,
  };
}
