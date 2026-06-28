/**
 * eBay card search API
 * GET /api/ebay/search?q=charizard+base+set&limit=25&sort=price
 */
import { NextRequest, NextResponse } from "next/server";
import { searchEbayListings } from "@/lib/ebay";
import { safeError } from "@/lib/safe-error";

// Track daily eBay API usage (5K/day limit)
let ebayDailyCount = 0;
let ebayResetDate = new Date().toISOString().slice(0, 10);
const EBAY_DAILY_LIMIT = 4500; // Leave 500 buffer

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "25"), 50);
  const sort = (req.nextUrl.searchParams.get("sort") || "newlyListed") as "price" | "-price" | "newlyListed" | "endingSoonest";
  const minPrice = req.nextUrl.searchParams.get("minPrice") ? parseFloat(req.nextUrl.searchParams.get("minPrice")!) : undefined;
  const maxPrice = req.nextUrl.searchParams.get("maxPrice") ? parseFloat(req.nextUrl.searchParams.get("maxPrice")!) : undefined;

  // Check eBay daily quota
  const today = new Date().toISOString().slice(0, 10);
  if (today !== ebayResetDate) {
    ebayDailyCount = 0;
    ebayResetDate = today;
  }
  if (ebayDailyCount >= EBAY_DAILY_LIMIT) {
    return NextResponse.json({ error: "eBay API daily limit reached", listings: [], totalResults: 0 }, { status: 429 });
  }
  ebayDailyCount++;

  try {
    const result = await searchEbayListings(q, { limit, sort, minPrice, maxPrice });
    return NextResponse.json(result);
  } catch (err) {
    return safeError(err, "eBay search temporarily unavailable.", { code: "EXTERNAL_SERVICE_ERROR", status: 502 });
  }
}
