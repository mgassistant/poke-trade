import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CARD_SELECT = "id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)";

// POST /api/cards/scan/ocr-match — Match card by number (from OCR)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { number, numberWithZeros, name } = body as {
    number: string;
    numberWithZeros?: string;
    name?: string;
  };

  if (!number) {
    return NextResponse.json({ error: "Card number is required" }, { status: 400 });
  }

  let matches: any[] = [];

  // Strategy 1: Exact number match (may return multiple sets)
  const { data: exactMatches } = await supabase
    .from("cards")
    .select(CARD_SELECT)
    .eq("number", number)
    .order("market_value", { ascending: false, nullsFirst: false })
    .limit(20);

  if (exactMatches && exactMatches.length > 0) {
    matches = exactMatches;
  }

  // Strategy 2: Try with leading zeros
  if (matches.length === 0 && numberWithZeros && numberWithZeros !== number) {
    const { data } = await supabase
      .from("cards")
      .select(CARD_SELECT)
      .eq("number", numberWithZeros)
      .order("market_value", { ascending: false, nullsFirst: false })
      .limit(20);
    if (data && data.length > 0) matches = data;
  }

  // If we have a name, filter/rank matches by name similarity
  if (matches.length > 1 && name) {
    const nameLower = name.toLowerCase();
    const nameWords = nameLower.split(/\s+/).filter((w) => w.length >= 2);

    // Score each match by name similarity
    const scored = matches.map((m) => {
      const matchName = (m.name || "").toLowerCase();
      let score = 0;
      for (const word of nameWords) {
        if (matchName.includes(word)) score += 2;
      }
      // Exact name match bonus
      if (matchName === nameLower) score += 10;
      // Starts with same word bonus
      if (matchName.startsWith(nameWords[0] || "")) score += 3;
      return { ...m, _score: score };
    });

    // Sort by score descending, then by market value
    scored.sort((a, b) => b._score - a._score || (b.market_value || 0) - (a.market_value || 0));
    matches = scored.map(({ _score, ...rest }) => rest);
  }

  return NextResponse.json(
    { matches: matches.slice(0, 10) },
    { headers: { "Cache-Control": "public, s-maxage=3600" } }
  );
}
