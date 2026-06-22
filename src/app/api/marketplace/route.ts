import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAGE_SIZE = 40;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("q") || "";
  const rarity = searchParams.get("rarity") || "";
  const set = searchParams.get("set") || "";
  const sort = searchParams.get("sort") || "value-desc";
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("cards")
    .select("*, card_sets(name, series, symbol_url, logo_url)", { count: "exact" })
    .not("image_url", "is", null);

  // Search by name
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Filter by rarity
  if (rarity && rarity !== "All") {
    query = query.eq("rarity", rarity);
  }

  // Filter by set
  if (set) {
    query = query.eq("set_id", set);
  }

  // Sort
  switch (sort) {
    case "value-desc":
      query = query.order("market_value", { ascending: false, nullsFirst: false });
      break;
    case "value-asc":
      query = query.order("market_value", { ascending: true, nullsFirst: true });
      break;
    case "name-asc":
      query = query.order("name", { ascending: true });
      break;
    case "name-desc":
      query = query.order("name", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("market_value", { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to match the TCGCard interface the frontend expects
  const cards = (data || []).map((card: any) => ({
    id: card.id,
    name: card.name,
    number: card.number,
    rarity: card.rarity,
    hp: card.hp ? String(card.hp) : undefined,
    illustrator: card.illustrator,
    supertype: card.supertype,
    subtypes: card.subtypes || [],
    images: {
      small: card.image_url?.replace("_hires", "") || card.image_url,
      large: card.image_url,
    },
    set: {
      id: card.set_id,
      name: card.card_sets?.name || "",
      series: card.card_sets?.series || "",
      images: {
        symbol: card.card_sets?.symbol_url || "",
        logo: card.card_sets?.logo_url || "",
      },
    },
    tcgplayer: card.market_value
      ? { prices: { holofoil: { market: card.market_value } } }
      : undefined,
    cardmarket: card.market_value
      ? { prices: { averageSellPrice: card.market_value } }
      : undefined,
  }));

  return NextResponse.json({
    cards,
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  });
}
