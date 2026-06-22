/**
 * Poke-Trade Database Seeder
 * Imports all Pokemon TCG sets and cards from the Pokemon TCG API
 * into our Supabase database, then enriches with PokemonPriceTracker pricing.
 *
 * Usage: npx tsx scripts/seed-database.ts [--sets-only] [--cards-only] [--set=sv4] [--update-prices]
 *
 * This uses the free Pokemon TCG API for card data/images (20K req/day)
 * and PokemonPriceTracker Pro for pricing (20K credits/day)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || "";
const PPT_API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TCG_BASE = "https://api.pokemontcg.io/v2";
const PPT_BASE = "https://www.pokemonpricetracker.com/api/v2";

const args = process.argv.slice(2);
const setsOnly = args.includes("--sets-only");
const cardsOnly = args.includes("--cards-only");
const updatePrices = args.includes("--update-prices");
const specificSet = args.find((a) => a.startsWith("--set="))?.split("=")[1];

// Rate limiting helper
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTCG(endpoint: string, params: Record<string, string> = {}, retries = 3): Promise<any> {
  const searchParams = new URLSearchParams(params);
  const url = `${TCG_BASE}/${endpoint}?${searchParams}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: TCG_API_KEY ? { "X-Api-Key": TCG_API_KEY } : {},
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 504 || res.status === 502 || res.status === 429) {
        console.log(`    ⏳ API ${res.status}, retry ${attempt}/${retries}...`);
        await sleep(5000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`TCG API ${res.status}`);
      return res.json();
    } catch (err: any) {
      if (attempt < retries && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        console.log(`    ⏳ Timeout, retry ${attempt}/${retries}...`);
        await sleep(5000 * attempt);
        continue;
      }
      if (attempt === retries) throw err;
    }
  }
}

async function fetchPPT(endpoint: string, params: Record<string, string> = {}) {
  if (!PPT_API_KEY) return null;
  const searchParams = new URLSearchParams(params);
  const url = `${PPT_BASE}/${endpoint}?${searchParams}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${PPT_API_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// ============================================================
// SEED SETS
// ============================================================
async function seedSets() {
  console.log("📦 Seeding sets...");
  let page = 1;
  let total = 0;

  while (true) {
    const data = await fetchTCG("sets", { page: String(page), pageSize: "100", orderBy: "-releaseDate" });
    const sets = data.data || [];
    if (sets.length === 0) break;

    const rows = sets.map((set: any) => ({
      id: set.id, // Use TCG API id as our primary key (e.g., "swsh4")
      name: set.name,
      series: set.series,
      release_date: set.releaseDate || null,
      total_cards: set.total || set.printedTotal || 0,
      symbol_url: set.images?.symbol || null,
      logo_url: set.images?.logo || null,
    }));

    const { error } = await supabase
      .from("card_sets")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Error on page ${page}:`, error.message);
    } else {
      total += rows.length;
      console.log(`  ✅ Page ${page}: ${rows.length} sets (${total} total)`);
    }

    if (sets.length < 100) break;
    page++;
    await sleep(200);
  }

  console.log(`📦 Done! ${total} sets seeded.\n`);
  return total;
}

// ============================================================
// SEED CARDS (per set)
// ============================================================
async function seedCardsForSet(setId: string) {
  let page = 1;
  let total = 0;

  while (true) {
    const data = await fetchTCG("cards", {
      q: `set.id:${setId}`,
      page: String(page),
      pageSize: "250",
      orderBy: "number",
    });
    const cards = data.data || [];
    if (cards.length === 0) break;

    const rows = cards.map((card: any) => ({
      id: card.id,
      set_id: setId,
      name: card.name,
      number: card.number,
      rarity: card.rarity || null,
      card_type: card.types?.[0] || null,
      hp: card.hp ? parseInt(card.hp) : null,
      illustrator: card.artist || null,
      image_url: card.images?.large || card.images?.small || null,
      market_value: getMarketValue(card),
      reverse_holo: false,
      first_edition: false,
      supertype: card.supertype || null,
      subtypes: card.subtypes || null,
      description: card.flavorText || null,
    }));

    const { error } = await supabase
      .from("cards")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

    if (error) {
      console.error(`    ❌ Error page ${page}:`, error.message);
    } else {
      total += rows.length;
    }

    if (cards.length < 250) break;
    page++;
    await sleep(300); // Rate limit
  }

  return total;
}

function getMarketValue(card: any): number | null {
  if (!card.tcgplayer?.prices) return null;
  const variants = Object.values(card.tcgplayer.prices) as any[];
  for (const v of variants) {
    if (v.market) return v.market;
    if (v.mid) return v.mid;
  }
  return null;
}

async function seedAllCards() {
  console.log("🃏 Seeding cards...");

  // Get all sets
  const { data: sets } = await supabase
    .from("card_sets")
    .select("id, name")
    .order("release_date", { ascending: false });

  if (!sets || sets.length === 0) {
    console.error("  ❌ No sets found. Run --sets-only first.");
    return;
  }

  const setsToSeed = specificSet
    ? sets.filter((s) => s.id === specificSet)
    : sets;

  let grandTotal = 0;
  for (let i = 0; i < setsToSeed.length; i++) {
    const set = setsToSeed[i];
    process.stdout.write(`  [${i + 1}/${setsToSeed.length}] ${set.name} (${set.id})... `);
    try {
      const count = await seedCardsForSet(set.id);
      console.log(`${count} cards`);
      grandTotal += count;
    } catch (err: any) {
      console.log(`❌ ${err.message?.slice(0, 80)}`);
    }
    await sleep(1000); // Be kind to the API
  }

  console.log(`\n🃏 Done! ${grandTotal} cards seeded across ${setsToSeed.length} sets.\n`);
}

// ============================================================
// UPDATE PRICES (from PokemonPriceTracker Pro)
// ============================================================
async function updatePricesFromPPT() {
  if (!PPT_API_KEY) {
    console.error("❌ POKEMON_PRICE_TRACKER_API_KEY not set");
    return;
  }

  console.log("💰 Updating prices from PokemonPriceTracker Pro...");

  // Get cards that need price updates (oldest first)
  const { data: cards } = await supabase
    .from("cards")
    .select("id, name, set_id")
    .order("updated_at", { ascending: true })
    .limit(500); // Process 500 at a time to stay within API limits

  if (!cards || cards.length === 0) {
    console.log("  No cards to update.");
    return;
  }

  let updated = 0;
  let credits = 0;

  // Batch by set for efficiency
  const bySet: Record<string, typeof cards> = {};
  for (const card of cards) {
    if (!bySet[card.set_id]) bySet[card.set_id] = [];
    bySet[card.set_id].push(card);
  }

  for (const [setId, setCards] of Object.entries(bySet)) {
    // Search PPT for this set's cards
    for (const card of setCards) {
      try {
        const data = await fetchPPT("cards", {
          search: card.name,
          limit: "1",
        });

        if (data?.data?.[0]?.prices?.market) {
          const pptCard = data.data[0];
          await supabase
            .from("cards")
            .update({
              market_value: pptCard.prices.market,
              updated_at: new Date().toISOString(),
            })
            .eq("id", card.id);
          updated++;
        }

        credits += data?.metadata?.apiCallsConsumed?.total || 1;
        await sleep(100);
      } catch {
        // Skip individual card errors
      }
    }

    console.log(`  Set ${setId}: ${setCards.length} cards checked`);
  }

  console.log(`\n💰 Done! ${updated} prices updated. ~${credits} API credits used.\n`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("🚀 Poké-Trade Database Seeder");
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   TCG API Key: ${TCG_API_KEY ? "✅" : "❌ (will be rate limited)"}`);
  console.log(`   PPT API Key: ${PPT_API_KEY ? "✅ Pro" : "❌ (no price updates)"}`);
  console.log("");

  if (updatePrices) {
    await updatePricesFromPPT();
    return;
  }

  if (!cardsOnly) {
    await seedSets();
  }

  if (!setsOnly) {
    await seedAllCards();
  }

  console.log("✅ Seeding complete!");
}

main().catch(console.error);
