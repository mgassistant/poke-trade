import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SeedProduct {
  retailer: string;
  product_name: string;
  product_url: string;
  retail_price: number;
  current_price: number;
  in_stock: boolean;
  category: string;
  set_name: string;
  release_date: string;
}

const SETS = [
  "Scarlet & Violet",
  "Paldea Evolved",
  "Obsidian Flames",
  "151",
  "Paradox Rift",
  "Temporal Forces",
  "Twilight Masquerade",
  "Shrouded Fable",
  "Stellar Crown",
  "Surging Sparks",
  "Prismatic Evolutions",
  "Journey Together",
];

const RETAILERS: Record<string, string> = {
  pokemon_center: "https://www.pokemoncenter.com/category/trading-card-game",
  target: "https://www.target.com/s?searchTerm=pokemon+cards",
  walmart: "https://www.walmart.com/search?q=pokemon+trading+cards",
  amazon: "https://www.amazon.com/s?k=pokemon+trading+cards",
  gamestop: "https://www.gamestop.com/search/?q=pokemon+cards",
  bestbuy: "https://www.bestbuy.com/site/searchpage.jsp?st=pokemon+cards",
  tcgplayer: "https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon",
  costco: "https://www.costco.com/pokemon.html",
};

function randomBool(pctTrue: number): boolean {
  return Math.random() * 100 < pctTrue;
}

function randomPrice(base: number, variance: number): number {
  const delta = (Math.random() - 0.5) * 2 * variance;
  return Math.round((base + delta) * 100) / 100;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function generateProducts(): SeedProduct[] {
  const products: SeedProduct[] = [];

  const templates: {
    category: string;
    nameSuffix: string;
    basePrice: number;
    variance: number;
    stockPct: number;
  }[] = [
    { category: "booster_pack", nameSuffix: "Booster Pack", basePrice: 4.49, variance: 0.5, stockPct: 75 },
    { category: "booster_pack", nameSuffix: "3-Pack Blister", basePrice: 13.99, variance: 1, stockPct: 65 },
    { category: "etb", nameSuffix: "Elite Trainer Box", basePrice: 49.99, variance: 5, stockPct: 40 },
    { category: "booster_box", nameSuffix: "Booster Box", basePrice: 143.99, variance: 15, stockPct: 30 },
    { category: "booster_box", nameSuffix: "Booster Bundle", basePrice: 24.99, variance: 2, stockPct: 55 },
    { category: "collection_box", nameSuffix: "Collection Box", basePrice: 29.99, variance: 5, stockPct: 50 },
    { category: "tin", nameSuffix: "Collector Tin", basePrice: 27.99, variance: 3, stockPct: 60 },
    { category: "special", nameSuffix: "Ultra Premium Collection", basePrice: 119.99, variance: 20, stockPct: 15 },
  ];

  const retailerKeys = Object.keys(RETAILERS);

  for (const set of SETS) {
    for (const tmpl of templates) {
      // Each product goes to 1-3 retailers
      const numRetailers = Math.min(retailerKeys.length, Math.floor(Math.random() * 3) + 1);
      const shuffled = [...retailerKeys].sort(() => Math.random() - 0.5);

      for (let r = 0; r < numRetailers; r++) {
        const retailer = shuffled[r];
        const retailPrice = tmpl.basePrice;
        const currentPrice = randomPrice(retailPrice, tmpl.variance);
        const inStock = randomBool(tmpl.stockPct);

        products.push({
          retailer,
          product_name: `${set} ${tmpl.nameSuffix}`,
          product_url: RETAILERS[retailer],
          retail_price: retailPrice,
          current_price: currentPrice,
          in_stock: inStock,
          category: tmpl.category,
          set_name: set,
          release_date: "2024-01-01",
        });
      }
    }
  }

  // Special products
  const specials: SeedProduct[] = [
    {
      retailer: "pokemon_center",
      product_name: "Prismatic Evolutions Super Premium Collection",
      product_url: "https://www.pokemoncenter.com",
      retail_price: 89.99,
      current_price: 89.99,
      in_stock: false,
      category: "special",
      set_name: "Prismatic Evolutions",
      release_date: "2025-01-17",
    },
    {
      retailer: "target",
      product_name: "Prismatic Evolutions Binder Collection",
      product_url: "https://www.target.com/s?searchTerm=prismatic+evolutions",
      retail_price: 39.99,
      current_price: 39.99,
      in_stock: true,
      category: "collection_box",
      set_name: "Prismatic Evolutions",
      release_date: "2025-01-17",
    },
    {
      retailer: "walmart",
      product_name: "Prismatic Evolutions Surprise Box",
      product_url: "https://www.walmart.com/search?q=prismatic+evolutions",
      retail_price: 34.98,
      current_price: 34.98,
      in_stock: false,
      category: "collection_box",
      set_name: "Prismatic Evolutions",
      release_date: "2025-01-17",
    },
    {
      retailer: "pokemon_center",
      product_name: "Journey Together Elite Trainer Box",
      product_url: "https://www.pokemoncenter.com",
      retail_price: 54.99,
      current_price: 54.99,
      in_stock: true,
      category: "etb",
      set_name: "Journey Together",
      release_date: "2025-03-28",
    },
    {
      retailer: "amazon",
      product_name: "Journey Together Booster Box",
      product_url: "https://www.amazon.com/s?k=journey+together+pokemon+booster+box",
      retail_price: 143.99,
      current_price: 128.99,
      in_stock: true,
      category: "booster_box",
      set_name: "Journey Together",
      release_date: "2025-03-28",
    },
    {
      retailer: "gamestop",
      product_name: "Charizard ex Premium Collection",
      product_url: "https://www.gamestop.com/search/?q=charizard+ex",
      retail_price: 39.99,
      current_price: 39.99,
      in_stock: false,
      category: "collection_box",
      set_name: "Scarlet & Violet",
      release_date: "2023-11-03",
    },
    {
      retailer: "bestbuy",
      product_name: "Surging Sparks Elite Trainer Box",
      product_url: "https://www.bestbuy.com/site/searchpage.jsp?st=surging+sparks",
      retail_price: 49.99,
      current_price: 44.99,
      in_stock: true,
      category: "etb",
      set_name: "Surging Sparks",
      release_date: "2024-11-08",
    },
    {
      retailer: "costco",
      product_name: "Pokémon TCG Premium Collection 6-Pack",
      product_url: "https://www.costco.com/pokemon.html",
      retail_price: 29.99,
      current_price: 29.99,
      in_stock: true,
      category: "special",
      set_name: "Surging Sparks",
      release_date: "2024-12-01",
    },
    {
      retailer: "tcgplayer",
      product_name: "151 Ultra Premium Collection",
      product_url: "https://www.tcgplayer.com/search/pokemon/product?q=151+ultra+premium",
      retail_price: 89.99,
      current_price: 159.99,
      in_stock: true,
      category: "special",
      set_name: "151",
      release_date: "2023-10-06",
    },
    {
      retailer: "tcgplayer",
      product_name: "Crown Zenith Elite Trainer Box",
      product_url: "https://www.tcgplayer.com/search/pokemon/product?q=crown+zenith+etb",
      retail_price: 49.99,
      current_price: 74.99,
      in_stock: true,
      category: "etb",
      set_name: "Crown Zenith",
      release_date: "2023-01-20",
    },
    {
      retailer: "pokemon_center",
      product_name: "Twilight Masquerade Booster Bundle",
      product_url: "https://www.pokemoncenter.com",
      retail_price: 24.99,
      current_price: 24.99,
      in_stock: true,
      category: "booster_box",
      set_name: "Twilight Masquerade",
      release_date: "2024-05-24",
    },
    {
      retailer: "target",
      product_name: "Shrouded Fable Elite Trainer Box",
      product_url: "https://www.target.com/s?searchTerm=shrouded+fable+etb",
      retail_price: 49.99,
      current_price: 49.99,
      in_stock: false,
      category: "etb",
      set_name: "Shrouded Fable",
      release_date: "2024-08-02",
    },
    {
      retailer: "walmart",
      product_name: "Obsidian Flames Booster Box",
      product_url: "https://www.walmart.com/search?q=obsidian+flames+booster+box",
      retail_price: 143.99,
      current_price: 109.97,
      in_stock: true,
      category: "booster_box",
      set_name: "Obsidian Flames",
      release_date: "2023-08-11",
    },
    {
      retailer: "amazon",
      product_name: "Paldea Evolved Elite Trainer Box",
      product_url: "https://www.amazon.com/s?k=paldea+evolved+etb",
      retail_price: 44.99,
      current_price: 37.99,
      in_stock: true,
      category: "etb",
      set_name: "Paldea Evolved",
      release_date: "2023-06-09",
    },
    {
      retailer: "gamestop",
      product_name: "Temporal Forces 3-Pack Blister (Cyclizar)",
      product_url: "https://www.gamestop.com/search/?q=temporal+forces",
      retail_price: 14.99,
      current_price: 14.99,
      in_stock: true,
      category: "booster_pack",
      set_name: "Temporal Forces",
      release_date: "2024-03-22",
    },
    {
      retailer: "bestbuy",
      product_name: "Stellar Crown Collector Tin",
      product_url: "https://www.bestbuy.com/site/searchpage.jsp?st=stellar+crown",
      retail_price: 27.99,
      current_price: 24.99,
      in_stock: true,
      category: "tin",
      set_name: "Stellar Crown",
      release_date: "2024-09-13",
    },
    {
      retailer: "costco",
      product_name: "Pokémon TCG Value Chest (10 Packs)",
      product_url: "https://www.costco.com/pokemon.html",
      retail_price: 39.99,
      current_price: 39.99,
      in_stock: false,
      category: "special",
      set_name: "Surging Sparks",
      release_date: "2024-11-08",
    },
    {
      retailer: "pokemon_center",
      product_name: "Paradox Rift Booster Box",
      product_url: "https://www.pokemoncenter.com",
      retail_price: 143.64,
      current_price: 143.64,
      in_stock: false,
      category: "booster_box",
      set_name: "Paradox Rift",
      release_date: "2023-11-03",
    },
  ];

  products.push(...specials);

  return products;
}

function generateAlerts(productIds: string[], productMap: Map<string, SeedProduct>): {
  product_id: string;
  alert_type: string;
  title: string;
  message: string;
  previous_price: number | null;
  new_price: number | null;
  created_at: string;
}[] {
  const alerts: ReturnType<typeof generateAlerts> = [];
  const types = ["restock", "price_drop", "new_release", "low_stock"];

  for (let i = 0; i < Math.min(40, productIds.length); i++) {
    const pid = productIds[i % productIds.length];
    const product = productMap.get(pid);
    if (!product) continue;

    const alertType = types[Math.floor(Math.random() * types.length)];
    const minutesAgo = Math.floor(Math.random() * 1440);
    const createdAt = new Date(Date.now() - minutesAgo * 60000).toISOString();

    const retailerLabel = product.retailer.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    let title = "";
    let message = "";
    let prevPrice: number | null = null;
    let newPrice: number | null = null;

    switch (alertType) {
      case "restock":
        title = `${product.product_name} back in stock!`;
        message = `Now available at ${retailerLabel} for $${product.current_price}`;
        break;
      case "price_drop":
        prevPrice = product.retail_price;
        newPrice = product.current_price;
        title = `Price drop on ${product.product_name}`;
        message = `Dropped from $${prevPrice} to $${newPrice} at ${retailerLabel}`;
        break;
      case "new_release":
        title = `New listing: ${product.product_name}`;
        message = `Now available at ${retailerLabel} for $${product.current_price}`;
        break;
      case "low_stock":
        title = `Low stock: ${product.product_name}`;
        message = `Running low at ${retailerLabel} — grab it before it's gone!`;
        break;
    }

    alerts.push({
      product_id: pid,
      alert_type: alertType,
      title,
      message,
      previous_price: prevPrice,
      new_price: newPrice,
      created_at: createdAt,
    });
  }

  return alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function POST() {
  // Admin auth check
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await authClient.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  // Clear existing data
  await supabase.from("drop_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("drop_watchlist").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("drop_products").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const seedProducts = generateProducts();

  // Insert in batches of 50
  const insertedIds: string[] = [];
  const productMap = new Map<string, SeedProduct>();

  for (let i = 0; i < seedProducts.length; i += 50) {
    const batch = seedProducts.slice(i, i + 50).map((p) => ({
      ...p,
      last_checked_at: daysAgo(Math.floor(Math.random() * 2)),
      last_in_stock_at: p.in_stock ? daysAgo(Math.floor(Math.random() * 5)) : null,
    }));

    const { data, error } = await supabase
      .from("drop_products")
      .insert(batch)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message, step: "products" }, { status: 500 });
    }

    if (data) {
      data.forEach((row, idx) => {
        insertedIds.push(row.id);
        productMap.set(row.id, seedProducts[i + idx]);
      });
    }
  }

  // Generate alerts
  const alerts = generateAlerts(insertedIds, productMap);

  for (let i = 0; i < alerts.length; i += 50) {
    const batch = alerts.slice(i, i + 50);
    const { error } = await supabase.from("drop_alerts").insert(batch);
    if (error) {
      return NextResponse.json({ error: error.message, step: "alerts" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    products_created: insertedIds.length,
    alerts_created: alerts.length,
  });
}
