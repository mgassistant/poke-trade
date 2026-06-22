const BASE_URL = "https://api.pokemontcg.io/v2";

export interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  number: string;
  artist?: string;
  rarity?: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    releaseDate: string;
    images: {
      symbol: string;
      logo: string;
    };
  };
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
    prices: Record<string, number | null>;
  };
}

export interface TCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

interface APIResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

async function fetchAPI<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<APIResponse<T>> {
  const searchParams = new URLSearchParams(params);
  const url = `${BASE_URL}/${endpoint}?${searchParams}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`Pokemon TCG API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function searchCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<APIResponse<TCGCard>> {
  return fetchAPI<TCGCard>("cards", {
    q: query,
    page: String(page),
    pageSize: String(pageSize),
    orderBy: "-set.releaseDate",
  });
}

export async function getCard(id: string): Promise<TCGCard> {
  const res = await fetch(`${BASE_URL}/cards/${id}`, {
    next: { revalidate: 3600 },
  });
  const data = await res.json();
  return data.data;
}

export async function getSets(
  page = 1,
  pageSize = 50
): Promise<APIResponse<TCGSet>> {
  return fetchAPI<TCGSet>("sets", {
    page: String(page),
    pageSize: String(pageSize),
    orderBy: "-releaseDate",
  });
}

export async function getSet(id: string): Promise<TCGSet> {
  const res = await fetch(`${BASE_URL}/sets/${id}`, {
    next: { revalidate: 3600 },
  });
  const data = await res.json();
  return data.data;
}

export async function getPopularCards(): Promise<TCGCard[]> {
  const queries = [
    'name:"charizard" supertype:pokemon rarity:"Rare Holo"',
    'name:"pikachu" supertype:pokemon rarity:"Rare"',
    'name:"mewtwo" supertype:pokemon',
    'name:"umbreon" supertype:pokemon rarity:"Rare"',
  ];

  const results = await Promise.all(
    queries.map((q) =>
      fetchAPI<TCGCard>("cards", { q, pageSize: "4", orderBy: "-set.releaseDate" })
    )
  );

  return results.flatMap((r) => r.data).slice(0, 12);
}

// Known card IDs that have confirmed working images
const FEATURED_CARD_IDS = [
  "swsh4-25",    // Charizard VMAX (Vivid Voltage)
  "swsh7-203",   // Umbreon VMAX Alt Art (Evolving Skies)
  "swsh45sv-SV107", // Charizard VMAX Shiny
  "sm35-1",      // Charizard GX
  "swsh35-44",   // Pikachu VMAX
  "swsh12pt5-160", // Lugia V Alt Art
  "swsh9-166",   // Arceus VSTAR
  "swsh11-174",  // Giratina VSTAR
];

export async function getFeaturedCards(): Promise<TCGCard[]> {
  try {
    const idQuery = FEATURED_CARD_IDS.map((id) => `id:${id}`).join(" OR ");
    const { data } = await fetchAPI<TCGCard>("cards", {
      q: idQuery,
      pageSize: "8",
    });
    return data.filter((card) => card.images?.large || card.images?.small);
  } catch {
    return [];
  }
}

export function getMarketPrice(card: TCGCard): number | null {
  if (!card.tcgplayer?.prices) return null;
  const priceTypes = Object.values(card.tcgplayer.prices);
  for (const p of priceTypes) {
    if (p.market) return p.market;
    if (p.mid) return p.mid;
  }
  return null;
}

export function formatCardPrice(price: number | null): string {
  if (price === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}
