/**
 * Walmart Drop Products — Matching Target priority items
 * Walmart item IDs extracted from walmart.com product pages
 */

export interface WalmartDropProduct {
  product_name: string;
  item_id: string;           // Walmart item ID (from URL)
  product_url: string;
  retail_price: number;
  category: string;
  set_name: string;
  priority: number;
  auto_buy: boolean;
  max_price: number;
}

export const WALMART_DROPS_2026_06_29: WalmartDropProduct[] = [
  // ═══ HIGH PRIORITY ═══
  {
    product_name: "Charizard X ex Ultra-Premium Collection",
    item_id: "17823811037",
    product_url: "https://www.walmart.com/ip/17823811037",
    retail_price: 99.99,
    category: "special",
    set_name: "Mega Evolution",
    priority: 1,
    auto_buy: true,
    max_price: 109.99, // MSRP + 10%
  },
  {
    product_name: "Ascended Heroes Elite Trainer Box",
    item_id: "18710966734",
    product_url: "https://www.walmart.com/ip/18710966734",
    retail_price: 54.99,
    category: "etb",
    set_name: "Ascended Heroes",
    priority: 1,
    auto_buy: true,
    max_price: 60.49, // MSRP + 10%
  },
  {
    product_name: "Prismatic Evolutions Super-Premium Collection",
    item_id: "16490008548",
    product_url: "https://www.walmart.com/ip/16490008548",
    retail_price: 89.99,
    category: "special",
    set_name: "Prismatic Evolutions",
    priority: 2,
    auto_buy: true,
    max_price: 98.99, // MSRP + 10%
  },
  {
    product_name: "Destined Rivals Elite Trainer Box",
    item_id: "19965460207",
    product_url: "https://www.walmart.com/ip/19965460207",
    retail_price: 54.99,
    category: "etb",
    set_name: "Destined Rivals",
    priority: 2,
    auto_buy: true,
    max_price: 60.49, // MSRP + 10%
  },

  // ═══ MEDIUM PRIORITY ═══
  {
    product_name: "Ascended Heroes Booster Bundle",
    item_id: "18728422476",
    product_url: "https://www.walmart.com/ip/18728422476",
    retail_price: 24.99,
    category: "booster_box",
    set_name: "Ascended Heroes",
    priority: 3,
    auto_buy: true,
    max_price: 27.49, // MSRP + 10%
  },
  {
    product_name: "Spring Charizard Ex Special Collection",
    item_id: "19594412970",
    product_url: "https://www.walmart.com/ip/19594412970",
    retail_price: 29.99,
    category: "collection_box",
    set_name: "Spring 2026",
    priority: 3,
    auto_buy: true,
    max_price: 32.99, // MSRP + 10%
  },
];
