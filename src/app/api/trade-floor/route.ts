// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "popular";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const search = searchParams.get("search");

  // Get sellers with active listings
  let listingsQuery = supabase
    .from("listings")
    .select(`
      id, title, price, condition, created_at,
      card:cards!listings_card_id_fkey(id, name, number, rarity, image_url, market_value, card_sets(name, symbol_url)),
      user:profiles!listings_user_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level, verification_level, last_active_at, is_featured, subscription_tier)
    `)
    .eq("status", "active");

  if (minPrice) listingsQuery = listingsQuery.gte("price", parseFloat(minPrice));
  if (maxPrice) listingsQuery = listingsQuery.lte("price", parseFloat(maxPrice));
  if (search) listingsQuery = listingsQuery.ilike("title", `%${search}%`);

  const { data: listings } = await listingsQuery.order("created_at", { ascending: false }).limit(500);

  if (!listings) {
    return NextResponse.json({ booths: [], featured: [] });
  }

  // Group by seller to create booths
  const boothMap = new Map<string, {
    seller: any;
    listings: any[];
    totalListings: number;
    isOnline: boolean;
    isAway: boolean;
  }>();

  const now = Date.now();
  for (const listing of listings) {
    const seller = listing.user;
    if (!seller) continue;

    if (!boothMap.has(seller.id)) {
      const lastActive = seller.last_active_at ? new Date(seller.last_active_at).getTime() : 0;
      const minutesAgo = (now - lastActive) / 60000;

      boothMap.set(seller.id, {
        seller,
        listings: [],
        totalListings: 0,
        isOnline: minutesAgo < 5,
        isAway: minutesAgo >= 5 && minutesAgo < 15,
      });
    }

    const booth = boothMap.get(seller.id)!;
    booth.totalListings++;
    if (booth.listings.length < 6) {
      booth.listings.push({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        condition: listing.condition,
        card: listing.card,
      });
    }
  }

  let booths = Array.from(boothMap.values());

  // Sort
  if (sort === "popular") {
    booths.sort((a, b) => b.totalListings - a.totalListings);
  } else if (sort === "rated") {
    booths.sort((a, b) => (b.seller.trade_score || 0) - (a.seller.trade_score || 0));
  } else if (sort === "newest") {
    booths.sort((a, b) => {
      const aDate = a.listings[0]?.created_at || "";
      const bDate = b.listings[0]?.created_at || "";
      return bDate.localeCompare(aDate);
    });
  }

  // Featured booths
  const featured = booths.filter(b => b.seller.is_featured || b.seller.subscription_tier === "elite");

  return NextResponse.json({
    booths: booths.slice(0, 50),
    featured: featured.slice(0, 6),
    activeTraders: booths.filter(b => b.isOnline).length,
  });
}
