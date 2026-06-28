/**
 * eBay card search API
 * GET /api/ebay/search?q=charizard+base+set&limit=25&sort=price
 */
import { NextRequest, NextResponse } from "next/server";
import { searchEbayListings } from "@/lib/ebay";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "25"), 50);
  const sort = (req.nextUrl.searchParams.get("sort") || "newlyListed") as "price" | "-price" | "newlyListed" | "endingSoonest";
  const minPrice = req.nextUrl.searchParams.get("minPrice") ? parseFloat(req.nextUrl.searchParams.get("minPrice")!) : undefined;
  const maxPrice = req.nextUrl.searchParams.get("maxPrice") ? parseFloat(req.nextUrl.searchParams.get("maxPrice")!) : undefined;

  try {
    const result = await searchEbayListings(q, { limit, sort, minPrice, maxPrice });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[eBay Search API]", err);
    return NextResponse.json({ error: "eBay search failed" }, { status: 500 });
  }
}
