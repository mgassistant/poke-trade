/**
 * Multi-source price comparison engine
 * Aggregates pricing from: Pokemon TCG API (TCGPlayer + CardMarket),
 * PokeTrace (eBay sold + graded), eBay Browse API, and direct TCGPlayer
 */
import { fetchEbayPrices } from "./ebay";

export interface PriceSource {
  source: string;
  platform: string;
  icon: string;
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
  lastUpdated: string | null;
  url: string | null;
  condition?: string;
}

export interface GradedPrice {
  grader: string;
  grade: string;
  price: number | null;
  lastSold: string | null;
  source: string;
}

export interface PriceComparison {
  cardName: string;
  cardId: string;
  setName: string;
  imageUrl: string | null;
  sources: PriceSource[];
  gradedPrices: GradedPrice[];
  bestPrice: PriceSource | null;
  averageMarket: number | null;
  priceSpread: number | null; // % difference between lowest and highest
}

// ============================================================
// Pokemon TCG API (pokemontcg.io) — FREE, no key needed
// Provides: TCGPlayer prices + CardMarket prices
// ============================================================
interface TCGApiCard {
  id: string;
  name: string;
  set: { name: string };
  images: { small: string; large: string };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: Record<string, {
      low: number | null;
      mid: number | null;
      high: number | null;
      market: number | null;
      directLow: number | null;
    }>;
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: {
      averageSellPrice: number | null;
      lowPrice: number | null;
      trendPrice: number | null;
      avg1: number | null;
      avg7: number | null;
      avg30: number | null;
    };
  };
}

async function fetchTCGApi(cardName: string): Promise<TCGApiCard[]> {
  try {
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(cardName)}"&pageSize=10&orderBy=-set.releaseDate`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

function extractTCGPlayerPrices(card: TCGApiCard): PriceSource[] {
  if (!card.tcgplayer?.prices) return [];

  return Object.entries(card.tcgplayer.prices).map(([condition, prices]) => ({
    source: "pokemontcg.io",
    platform: "TCGPlayer",
    icon: "🏪",
    low: prices.low,
    mid: prices.mid,
    high: prices.high,
    market: prices.market,
    lastUpdated: card.tcgplayer?.updatedAt || null,
    url: card.tcgplayer?.url || null,
    condition: formatCondition(condition),
  }));
}

function extractCardMarketPrices(card: TCGApiCard): PriceSource | null {
  if (!card.cardmarket?.prices) return null;

  const p = card.cardmarket.prices;
  return {
    source: "pokemontcg.io",
    platform: "CardMarket (EU)",
    icon: "🇪🇺",
    low: p.lowPrice,
    mid: p.averageSellPrice,
    high: null,
    market: p.trendPrice,
    lastUpdated: card.cardmarket?.updatedAt || null,
    url: card.cardmarket?.url || null,
  };
}

// ============================================================
// PokeTrace API — Free tier: US market + raw prices
// Provides: eBay sold data + TCGPlayer + CardMarket combined
// ============================================================
async function fetchPokeTrace(cardName: string): Promise<PriceSource[]> {
  const apiKey = process.env.POKETRACE_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.poketrace.com/v1/cards?search=${encodeURIComponent(cardName)}&limit=3`,
      {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const sources: PriceSource[] = [];

    for (const card of (data.data || []) as Record<string, unknown>[]) {
      const prices = card.prices as Record<string, unknown> | undefined;
      const ebay = prices?.ebay as Record<string, Record<string, number>> | undefined;
      const urls = card.marketplaceUrls as Record<string, string> | undefined;

      if (ebay) {
        // Get Near Mint or Lightly Played eBay data
        const nmData = ebay.NEAR_MINT || ebay.LIGHTLY_PLAYED || Object.values(ebay)[0];
        if (nmData) {
          sources.push({
            source: "poketrace.com",
            platform: "eBay Sold",
            icon: "🔨",
            low: nmData.low || null,
            mid: nmData.avg || null,
            high: nmData.high || null,
            market: nmData.avg30d || nmData.avg || null,
            lastUpdated: (nmData.lastUpdated as unknown as string) || null,
            url: urls?.ebay || null,
            condition: "Near Mint",
          });
        }
      }
    }
    return sources;
  } catch {
    return [];
  }
}

// ============================================================
// PokemonPriceTracker API — Free: 100 credits/day
// Provides: TCGPlayer + eBay + PSA/BGS/CGC graded prices
// ============================================================
async function fetchPriceTracker(cardName: string): Promise<{ sources: PriceSource[]; graded: GradedPrice[] }> {
  const apiKey = process.env.POKEMON_PRICE_TRACKER_API_KEY;
  if (!apiKey) return { sources: [], graded: [] };

  try {
    const res = await fetch(
      `https://api.pokemonpricetracker.com/v1/cards/search?name=${encodeURIComponent(cardName)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return { sources: [], graded: [] };
    const data = await res.json();

    const sources: PriceSource[] = [];
    const graded: GradedPrice[] = [];

    // Extract eBay sold data
    if (data.ebay) {
      sources.push({
        source: "pokemonpricetracker.com",
        platform: "eBay Recent Sales",
        icon: "🔨",
        low: data.ebay.low,
        mid: data.ebay.average,
        high: data.ebay.high,
        market: data.ebay.market,
        lastUpdated: data.ebay.lastUpdated,
        url: data.ebay.searchUrl,
      });
    }

    // Extract graded prices
    if (data.gradedPrices) {
      for (const [grader, grades] of Object.entries(data.gradedPrices as Record<string, Record<string, number>>)) {
        for (const [grade, price] of Object.entries(grades)) {
          graded.push({
            grader: grader.toUpperCase(),
            grade,
            price: price as number,
            lastSold: null,
            source: "pokemonpricetracker.com",
          });
        }
      }
    }

    return { sources, graded };
  } catch {
    return { sources: [], graded: [] };
  }
}

// ============================================================
// Main comparison function
// ============================================================
export async function getComparisonPrices(cardName: string): Promise<PriceComparison[]> {
  // Fetch from all sources in parallel
  const [tcgCards, pokeTraceResults, priceTrackerResults, ebayResults] = await Promise.allSettled([
    fetchTCGApi(cardName),
    fetchPokeTrace(cardName),
    fetchPriceTracker(cardName),
    fetchEbayPrices(cardName),
  ]);

  const cards = tcgCards.status === "fulfilled" ? tcgCards.value : [];
  const pokeTrace = pokeTraceResults.status === "fulfilled" ? pokeTraceResults.value : [];
  const priceTracker = priceTrackerResults.status === "fulfilled" ? priceTrackerResults.value : { sources: [], graded: [] };
  const ebay = ebayResults.status === "fulfilled" ? ebayResults.value : [];

  return cards.slice(0, 5).map((card) => {
    const sources: PriceSource[] = [
      ...extractTCGPlayerPrices(card),
      ...(extractCardMarketPrices(card) ? [extractCardMarketPrices(card)!] : []),
      ...pokeTrace,
      ...priceTracker.sources,
      ...ebay,
    ];

    // Find best price
    const validPrices = sources.filter((s) => s.market !== null);
    const bestPrice = validPrices.length > 0
      ? validPrices.reduce((best, s) => (s.market! < (best.market || Infinity) ? s : best))
      : null;

    // Calculate average market
    const marketPrices = validPrices.map((s) => s.market!).filter(Boolean);
    const averageMarket = marketPrices.length > 0
      ? marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length
      : null;

    // Price spread
    const lowestMarket = marketPrices.length > 0 ? Math.min(...marketPrices) : null;
    const highestMarket = marketPrices.length > 0 ? Math.max(...marketPrices) : null;
    const priceSpread = lowestMarket && highestMarket && lowestMarket > 0
      ? ((highestMarket - lowestMarket) / lowestMarket) * 100
      : null;

    return {
      cardName: card.name,
      cardId: card.id,
      setName: card.set.name,
      imageUrl: card.images?.large || card.images?.small || null,
      sources,
      gradedPrices: priceTracker.graded,
      bestPrice,
      averageMarket,
      priceSpread,
    };
  });
}

function formatCondition(raw: string): string {
  const map: Record<string, string> = {
    normal: "Near Mint",
    holofoil: "Holofoil",
    reverseHolofoil: "Reverse Holo",
    "1stEditionHolofoil": "1st Ed Holo",
    "1stEditionNormal": "1st Ed Normal",
    unlimitedHolofoil: "Unlimited Holo",
  };
  return map[raw] || raw;
}

// Available APIs summary for the platform
export const AVAILABLE_APIS = [
  {
    name: "Pokémon TCG API",
    url: "https://pokemontcg.io",
    status: "active" as const,
    free: true,
    provides: ["Card images", "TCGPlayer prices", "CardMarket (EU) prices", "Set data", "Card metadata"],
    rateLimit: "Unlimited (no key) / 20K/day (with key)",
  },
  {
    name: "PokeTrace",
    url: "https://poketrace.com",
    status: "active" as const,
    free: false,
    provides: ["eBay sold by condition (1d/7d/30d avg)", "TCGPlayer prices", "CardMarket prices", "Direct eBay search links", "Card images (CDN)"],
    rateLimit: "250 req/day (Free tier)",
  },
  {
    name: "PokemonPriceTracker",
    url: "https://pokemonpricetracker.com",
    status: "active" as const,
    free: false,
    provides: ["TCGPlayer prices", "eBay sold data", "PSA/BGS/CGC graded prices", "6mo price history", "Japanese card data", "Sealed product prices"],
    rateLimit: "Pro: 20,000 credits/day",
  },
  {
    name: "JustTCG",
    url: "https://justtcg.com",
    status: "ready" as const,
    free: true,
    provides: ["TCGPlayer prices", "Condition-specific pricing", "Foil pricing", "Bulk lookups"],
    rateLimit: "Free tier available",
  },
  {
    name: "TCG API",
    url: "https://tcgapi.dev",
    status: "ready" as const,
    free: true,
    provides: ["Price history (weekly data points)", "Market prices $1+", "Historical trends"],
    rateLimit: "Free tier available",
  },
  {
    name: "TCGPlayer Official",
    url: "https://docs.tcgplayer.com",
    status: "planned" as const,
    free: false,
    provides: ["Official market prices", "Product search", "Seller data"],
    rateLimit: "Requires partnership application",
  },
  {
    name: "eBay Browse API",
    url: "https://developer.ebay.com",
    status: "active" as const,
    free: true,
    provides: ["Active listings", "Real-time pricing", "Seller data", "Search by category"],
    rateLimit: "5K calls/day",
  },
] as const;
