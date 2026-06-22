// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";

const PPT_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY;
const PPT_BASE = "https://www.pokemonpricetracker.com/api/v2";

// GET /api/prices?search=charizard&includeHistory=true&includeEbay=true
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const tcgPlayerId = searchParams.get("tcgPlayerId");
  const includeHistory = searchParams.get("includeHistory") === "true";
  const includeEbay = searchParams.get("includeEbay") === "true";
  const days = searchParams.get("days") || "30";
  const limit = searchParams.get("limit") || "10";

  if (!search && !tcgPlayerId) {
    return NextResponse.json({ error: "search or tcgPlayerId required" }, { status: 400 });
  }

  if (!PPT_KEY) {
    return NextResponse.json({ error: "Price tracker not configured" }, { status: 503 });
  }

  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tcgPlayerId) params.set("tcgPlayerId", tcgPlayerId);
    if (includeHistory) params.set("includeHistory", "true");
    if (includeEbay) params.set("includeEbay", "true");
    if (includeHistory) params.set("days", days);
    params.set("limit", limit);

    const res = await fetch(`${PPT_BASE}/cards?${params}`, {
      headers: { Authorization: `Bearer ${PPT_KEY}` },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "API error", details: err }, { status: res.status });
    }

    const data = await res.json();

    // Enrich with TCGPlayer CDN images (higher quality)
    const enriched = (data.data || []).map((card: any) => ({
      id: card.id,
      tcgPlayerId: card.tcgPlayerId,
      name: card.name,
      setName: card.setName,
      cardNumber: card.cardNumber,
      rarity: card.rarity,
      artist: card.artist,
      pokemonType: card.pokemonType,
      hp: card.hp,
      // Images - use CDN URLs
      images: {
        small: card.imageCdnUrl200 || card.imageUrl,
        medium: card.imageCdnUrl400,
        large: card.imageCdnUrl800 || card.imageCdnUrl,
      },
      // TCGPlayer pricing
      tcgplayer: {
        market: card.prices?.market,
        low: card.prices?.low,
        sellers: card.prices?.sellers,
        lastUpdated: card.prices?.lastUpdated,
        url: card.tcgPlayerUrl,
        variants: card.prices?.variants,
      },
      // eBay sold data (when requested)
      ebay: card.ebayData || null,
      // Price history (when requested)
      priceHistory: card.priceHistory || null,
      // Japanese data (Pro feature)
      japanese: card.japaneseData || null,
    }));

    return NextResponse.json({
      data: enriched,
      metadata: data.metadata,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
