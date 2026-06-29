/**
 * Target Drop Products — Real SKUs for tonight's 12AM PST drop
 * Source: CCN restock intel, June 28, 2026
 * 
 * These get seeded into drop_products for monitoring + auto-cart
 */

export interface TargetDropProduct {
  product_name: string;
  sku: string;            // Target SKU/DPCI
  tcin: string;           // Target TCIN (for API/URL)
  product_url: string;
  retail_price: number;
  category: string;
  set_name: string;
  estimated_stock: string;  // "<1000", "20k+", etc.
  priority: number;        // 1 = highest (most limited/valuable)
  auto_buy: boolean;       // Whether to attempt auto-cart
  max_price: number;       // Max price for auto-buy
}

export const TARGET_DROPS_2026_06_29: TargetDropProduct[] = [
  // ═══ HIGH PRIORITY — Limited stock, high value ═══
  {
    product_name: "Charizard X ex Ultra-Premium Collection",
    sku: "94681790",
    tcin: "94681790",
    product_url: "https://www.target.com/p/-/A-94681790",
    retail_price: 99.99,
    category: "special",
    set_name: "Mega Evolution",
    estimated_stock: "<1000",
    priority: 1,
    auto_buy: true,
    max_price: 109.99, // MSRP + 10%
  },
  {
    product_name: "Ascended Heroes Elite Trainer Box",
    sku: "95082118",
    tcin: "95082118",
    product_url: "https://www.target.com/p/-/A-95082118",
    retail_price: 54.99,
    category: "etb",
    set_name: "Ascended Heroes",
    estimated_stock: "<1000",
    priority: 1,
    auto_buy: true,
    max_price: 60.49, // MSRP + 10%
  },
  {
    product_name: "Mega Evolution Booster Bundle",
    sku: "94681782",
    tcin: "94681782",
    product_url: "https://www.target.com/p/-/A-94681782",
    retail_price: 24.99,
    category: "booster_box",
    set_name: "Mega Evolution",
    estimated_stock: "<1000",
    priority: 1,
    auto_buy: true,
    max_price: 27.49, // MSRP + 10%
  },
  {
    product_name: "Prismatic Evolutions Super-Premium Collection",
    sku: "94300072",
    tcin: "94300072",
    product_url: "https://www.target.com/p/-/A-94300072",
    retail_price: 89.99,
    category: "special",
    set_name: "Prismatic Evolutions",
    estimated_stock: "9K",
    priority: 2,
    auto_buy: true,
    max_price: 98.99, // MSRP + 10%
  },

  // ═══ MEDIUM PRIORITY — Good stock, still valuable ═══
  {
    product_name: "Mega Greninja ex Premium Collection",
    sku: "1011209273",
    tcin: "1011209273",
    product_url: "https://www.target.com/p/-/A-1011209273",
    retail_price: 39.99,
    category: "collection_box",
    set_name: "Mega Evolution",
    estimated_stock: "5k+",
    priority: 3,
    auto_buy: true,
    max_price: 43.99, // MSRP + 10%
  },
  {
    product_name: "First Partner Illustration Collection Series 2",
    sku: "1011209279",
    tcin: "1011209279",
    product_url: "https://www.target.com/p/-/A-1011209279",
    retail_price: 49.99,
    category: "collection_box",
    set_name: "First Partner",
    estimated_stock: "8k+",
    priority: 3,
    auto_buy: true,
    max_price: 54.99, // MSRP + 10%
  },
  {
    product_name: "Mega Moonlit Tin — Mega Clefable",
    sku: "1010892073",
    tcin: "1010892073",
    product_url: "https://www.target.com/p/-/A-1010892073",
    retail_price: 27.99,
    category: "tin",
    set_name: "Mega Moonlit",
    estimated_stock: "6k+",
    priority: 4,
    auto_buy: false,
    max_price: 30.79, // MSRP + 10%
  },
  {
    product_name: "Mega Moonlit Tin — Mega Gengar",
    sku: "1010892077",
    tcin: "1010892077",
    product_url: "https://www.target.com/p/-/A-1010892077",
    retail_price: 27.99,
    category: "tin",
    set_name: "Mega Moonlit",
    estimated_stock: "6k+",
    priority: 4,
    auto_buy: false,
    max_price: 30.79, // MSRP + 10%
  },
  {
    product_name: "Prismatic Evolutions Poster Collection",
    sku: "93803457",
    tcin: "93803457",
    product_url: "https://www.target.com/p/-/A-93803457",
    retail_price: 24.99,
    category: "collection_box",
    set_name: "Prismatic Evolutions",
    estimated_stock: "20k+",
    priority: 5,
    auto_buy: false,
    max_price: 27.49, // MSRP + 10%
  },

  // ═══ LOWER PRIORITY — High stock ═══
  {
    product_name: "Ascended Heroes Booster Bundle",
    sku: "95120834",
    tcin: "95120834",
    product_url: "https://www.target.com/p/-/A-95120834",
    retail_price: 24.99,
    category: "booster_box",
    set_name: "Ascended Heroes",
    estimated_stock: "20k+",
    priority: 5,
    auto_buy: false,
    max_price: 27.49, // MSRP + 10%
  },
  {
    product_name: "Chaos Rising Elite Trainer Box",
    sku: "95267143",
    tcin: "95267143",
    product_url: "https://www.target.com/p/-/A-95267143",
    retail_price: 54.99,
    category: "etb",
    set_name: "Chaos Rising",
    estimated_stock: "20k",
    priority: 5,
    auto_buy: false,
    max_price: 60.49, // MSRP + 10%
  },
  {
    product_name: "Chaos Rising Booster Bundle",
    sku: "95298172",
    tcin: "95298172",
    product_url: "https://www.target.com/p/-/A-95298172",
    retail_price: 24.99,
    category: "booster_box",
    set_name: "Chaos Rising",
    estimated_stock: "20k",
    priority: 5,
    auto_buy: false,
    max_price: 27.49, // MSRP + 10%
  },
  {
    product_name: "Chaos Rising Three-Booster Blister",
    sku: "95298174",
    tcin: "95298174",
    product_url: "https://www.target.com/p/-/A-95298174",
    retail_price: 14.99,
    category: "booster_pack",
    set_name: "Chaos Rising",
    estimated_stock: "15k+",
    priority: 6,
    auto_buy: false,
    max_price: 16.49, // MSRP + 10%
  },

  // ═══ POTENTIAL SURPRISE DROPS ═══
  {
    product_name: "Destined Rivals Elite Trainer Box",
    sku: "1011467802",
    tcin: "1011467802",
    product_url: "https://www.target.com/p/-/A-1011467802",
    retail_price: 54.99,
    category: "etb",
    set_name: "Destined Rivals",
    estimated_stock: "Unknown",
    priority: 2,
    auto_buy: true,
    max_price: 60.49, // MSRP + 10%
  },
];
