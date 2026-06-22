import { NextRequest, NextResponse } from "next/server";

// GET /api/cards/search — Search Pokemon TCG API for cards
// This proxies through our backend so we can add caching, rate limiting, etc.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "20";

  if (!query.trim()) {
    return NextResponse.json({ data: [], totalCount: 0 });
  }

  try {
    const apiUrl = `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(query)}"&page=${page}&pageSize=${pageSize}&orderBy=-set.releaseDate`;

    const res = await fetch(apiUrl, {
      headers: {
        ...(process.env.POKEMON_TCG_API_KEY
          ? { "X-Api-Key": process.env.POKEMON_TCG_API_KEY }
          : {}),
      },
      next: { revalidate: 1800 }, // Cache 30 min
    });

    if (!res.ok) {
      return NextResponse.json({ error: "API error", status: res.status }, { status: 502 });
    }

    const data = await res.json();

    // Filter to only cards with images
    const filtered = (data.data || []).filter(
      (card: { images?: { small?: string; large?: string } }) =>
        card.images?.small || card.images?.large
    );

    return NextResponse.json({
      data: filtered,
      totalCount: data.totalCount || 0,
      page: data.page || 1,
      pageSize: data.pageSize || 20,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}
