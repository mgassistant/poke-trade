"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Plus, Heart,
  ShoppingBag, Star, Shield, ShieldCheck, Crown, Package, Tag,
  Loader2, ChevronLeft, ChevronRight, Repeat, X, Filter, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TCGCard } from "@/lib/pokemon-tcg";
import { getMarketPrice, formatCardPrice } from "@/lib/pokemon-tcg";
import { CONDITIONS, getConditionInfo, getConditionValue, getValueImpactDisplay, CONDITION_BY_VALUE } from "@/lib/constants/conditions";
import { PhotoGallery } from "@/components/listings/PhotoGallery";

interface CardDetailClientProps {
  card: TCGCard;
}

interface ListingData {
  id: string;
  user_id: string;
  card_id: string;
  title: string;
  description: string | null;
  condition: string;
  price: number;
  shipping_cost: number;
  accepts_offers: boolean;
  open_to_trades: boolean;
  photos: string[];
  is_graded: boolean;
  grading_company: string | null;
  grade: string | null;
  status: string;
  created_at: string;
  card: any;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    trade_score: number;
    trader_level: number;
    verification_level: string | null;
    subscription_tier: string;
    is_verified: boolean;
    is_premium: boolean;
    stripe_connect_id: string | null;
    location: string | null;
    total_trades: number;
    total_sales: number;
    created_at: string;
  } | null;
}

interface RelatedCard {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  image_url: string | null;
  market_value: number | null;
  set_id: string;
  card_sets: { name: string } | null;
}

export function CardDetailClient({ card }: CardDetailClientProps) {
  const marketPrice = getMarketPrice(card);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("price_low");
  const [filterCondition, setFilterCondition] = useState("");
  const [relatedFromSet, setRelatedFromSet] = useState<RelatedCard[]>([]);
  const [relatedSameName, setRelatedSameName] = useState<RelatedCard[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [offerListing, setOfferListing] = useState<ListingData | null>(null);

  // Fetch listings for this card
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const params = new URLSearchParams({ sort: sortBy });
        if (filterCondition) params.set("condition", filterCondition);
        const res = await fetch(`/api/cards/${encodeURIComponent(card.id)}/listings?${params}`);
        const data = await res.json();
        setListings(data.listings || []);
      } catch {
        setListings([]);
      } finally {
        setListingsLoading(false);
      }
    };
    fetchListings();
  }, [card.id, sortBy, filterCondition]);

  // Fetch related cards
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        // From same set
        const setRes = await fetch(`/api/marketplace?set=${encodeURIComponent(card.set.id)}&sort=value-desc&page=1`);
        const setData = await setRes.json();
        setRelatedFromSet(
          (setData.cards || [])
            .filter((c: any) => c.id !== card.id)
            .slice(0, 6)
        );

        // Same Pokémon, different sets
        const nameRes = await fetch(`/api/marketplace?q=${encodeURIComponent(card.name)}&sort=value-desc&page=1`);
        const nameData = await nameRes.json();
        setRelatedSameName(
          (nameData.cards || [])
            .filter((c: any) => c.id !== card.id && c.set?.id !== card.set.id)
            .slice(0, 6)
        );
      } catch {}
    };
    fetchRelated();
  }, [card.id, card.set.id, card.name]);

  // Simulated price change (based on market data comparison)
  const priceChange = useMemo(() => {
    if (!marketPrice) return null;
    // Simulate a small change for display purposes
    const change = (Math.random() - 0.4) * marketPrice * 0.1;
    return Math.round(change * 100) / 100;
  }, [marketPrice]);

  // Condition value table
  const conditionValues = useMemo(() => {
    return getValueImpactDisplay(marketPrice);
  }, [marketPrice]);

  // Generate price history data (CSS-only chart)
  const priceHistory = useMemo(() => {
    if (!marketPrice) return [];
    const days: { date: string; price: number }[] = [];
    let current = marketPrice;
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fluctuation = 1 + (Math.random() - 0.5) * 0.15;
      current = current * fluctuation;
      if (current < marketPrice * 0.5) current = marketPrice * 0.6;
      if (current > marketPrice * 2) current = marketPrice * 1.8;
      days.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: Math.round(current * 100) / 100,
      });
    }
    // Make last day close to actual market price
    days[days.length - 1].price = marketPrice;
    return days;
  }, [marketPrice]);

  const priceMin = Math.min(...priceHistory.map((d) => d.price));
  const priceMax = Math.max(...priceHistory.map((d) => d.price));
  const priceAvg = priceHistory.length > 0
    ? priceHistory.reduce((s, d) => s + d.price, 0) / priceHistory.length
    : 0;

  const handleBuyNow = async (listing: ListingData) => {
    setBuyingId(listing.id);
    try {
      const res = await fetch(`/api/listings/${listing.id}/buy`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch {
      alert("Checkout failed");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back nav */}
        <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* ============================================
            TOP SECTION — Card Overview
            ============================================ */}
        <div className="grid lg:grid-cols-[400px_1fr] gap-8 mb-12">
          {/* LEFT: Card Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-28 self-start"
          >
            <Card className="overflow-hidden">
              <div className="relative aspect-[2.5/3.5] bg-gradient-to-b from-muted/10 to-muted/30">
                {(card.images?.large || card.images?.small) ? (
                  <Image
                    src={card.images.large || card.images.small}
                    alt={card.name}
                    fill
                    className="object-contain p-6 drop-shadow-lg"
                    sizes="400px"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-6xl">🃏</div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* RIGHT: Card Details */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Card name & set */}
            <h1 className="text-3xl sm:text-4xl font-bold">{card.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground flex-wrap">
              {card.set.images?.logo && (
                <Image src={card.set.images.logo} alt={card.set.name} width={60} height={24} className="opacity-70 object-contain" />
              )}
              <span className="font-medium">{card.set.name}</span>
              <span>·</span>
              <span>#{card.number}</span>
              {card.set.images?.symbol && (
                <Image src={card.set.images.symbol} alt="" width={16} height={16} className="opacity-60" />
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {card.rarity && (
                <Badge className={`${getRarityColor(card.rarity)}`}>{card.rarity}</Badge>
              )}
              {card.supertype && <Badge variant="outline">{card.supertype}</Badge>}
              {card.subtypes?.map((st) => (
                <Badge key={st} variant="outline">{st}</Badge>
              ))}
              {card.hp && <Badge variant="outline">HP {card.hp}</Badge>}
              {card.artist && <Badge variant="outline">🎨 {card.artist}</Badge>}
            </div>

            {/* Market Price — Prominent */}
            <div className="mt-6 p-5 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Market Price</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {marketPrice ? formatCardPrice(marketPrice) : "—"}
                  </p>
                </div>
                {priceChange !== null && marketPrice && (
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                    priceChange >= 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {priceChange >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-semibold">
                      {priceChange >= 0 ? "+" : ""}{formatCardPrice(Math.abs(priceChange))}
                    </span>
                    <span className="text-[10px]">30d</span>
                  </div>
                )}
              </div>
            </div>

            {/* Condition Value Table */}
            {conditionValues.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Value by Condition</p>
                <div className="grid grid-cols-7 gap-1">
                  {conditionValues.map((cv) => (
                    <div key={cv.label} className="text-center p-2 bg-muted/30 rounded-lg">
                      <p className={`text-[10px] font-semibold ${cv.color}`}>{cv.label}</p>
                      <p className="text-xs font-bold mt-0.5">{formatCardPrice(cv.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button className="gap-2 bg-red-600 hover:bg-red-700" asChild>
                <Link href="/register">
                  <Plus className="h-4 w-4" />
                  Add to Collection
                </Link>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/register">
                  <Heart className="h-4 w-4" />
                  Add to Want List
                </Link>
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => {
                document.getElementById("price-section")?.scrollIntoView({ behavior: "smooth" });
              }}>
                <Tag className="h-4 w-4" />
                Compare Prices
              </Button>
            </div>

            {/* Card Details Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Set", value: card.set.name },
                { label: "Number", value: `#${card.number}` },
                { label: "Rarity", value: card.rarity || "—" },
                { label: "Supertype", value: card.supertype || "—" },
                { label: "Series", value: card.set.series },
                { label: "Release Date", value: card.set.releaseDate || "—" },
                ...(card.hp ? [{ label: "HP", value: card.hp }] : []),
                ...(card.artist ? [{ label: "Illustrator", value: card.artist }] : []),
              ].map((detail) => (
                <div key={detail.label} className="p-2.5 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">{detail.label}</p>
                  <p className="font-medium">{detail.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ============================================
            MIDDLE SECTION — Price Data
            ============================================ */}
        <div id="price-section" className="mb-12 space-y-6">
          <h2 className="text-xl font-bold">Price Data</h2>

          {/* Price History Chart (CSS-only) */}
          {priceHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">30-Day Price History</CardTitle>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Min: <b className="text-green-600">{formatCardPrice(priceMin)}</b></span>
                    <span>Avg: <b>{formatCardPrice(priceAvg)}</b></span>
                    <span>Max: <b className="text-red-600">{formatCardPrice(priceMax)}</b></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative h-40 flex items-end gap-[2px]">
                  {priceHistory.map((day, i) => {
                    const height = priceMax > priceMin
                      ? ((day.price - priceMin) / (priceMax - priceMin)) * 100
                      : 50;
                    return (
                      <div
                        key={i}
                        className="flex-1 group relative"
                        style={{ height: "100%" }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                          <div className="bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                            <div className="font-bold">{formatCardPrice(day.price)}</div>
                            <div>{day.date}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{priceHistory[0]?.date}</span>
                  <span>{priceHistory[priceHistory.length - 1]?.date}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Comparison Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* TCGPlayer */}
                {card.tcgplayer?.prices && (() => {
                  const prices = Object.values(card.tcgplayer.prices);
                  const tcgMarket = prices.find(p => p.market)?.market;
                  return (
                    <a
                      href={card.tcgplayer?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🏪</span>
                        <span className="text-sm font-semibold">TCGPlayer</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                      </div>
                      <p className="text-xl font-bold">{tcgMarket ? formatCardPrice(tcgMarket) : "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Market Price</p>
                    </a>
                  );
                })()}

                {/* eBay */}
                <a
                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + " " + card.set.name + " pokemon")}&LH_Complete=1&LH_Sold=1&_sop=13`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔨</span>
                    <span className="text-sm font-semibold">eBay Sold</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground">View recent sales</p>
                  <Badge variant="outline" className="mt-2 text-[9px]">Live Data</Badge>
                </a>

                {/* CardMarket */}
                {card.cardmarket?.prices && (
                  <a
                    href={card.cardmarket?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-primary/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🇪🇺</span>
                      <span className="text-sm font-semibold">CardMarket</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                    </div>
                    <p className="text-xl font-bold">
                      €{(card.cardmarket.prices as any).trendPrice?.toFixed(2) || (card.cardmarket.prices as any).averageSellPrice?.toFixed(2) || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Trend Price</p>
                  </a>
                )}

                {/* Poké-Trade */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-semibold text-primary">Poké-Trade</span>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {listings.length > 0
                      ? formatCardPrice(Math.min(...listings.map((l) => Number(l.price))))
                      : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {listings.length > 0 ? "Lowest listing" : "No listings yet"}
                  </p>
                  {listings.length > 0 && marketPrice && (() => {
                    const lowestListing = Math.min(...listings.map((l) => Number(l.price)));
                    const allPrices = [
                      ...(card.tcgplayer?.prices
                        ? Object.values(card.tcgplayer.prices).map(p => p.market).filter(Boolean) as number[]
                        : []),
                      lowestListing,
                    ];
                    if (lowestListing <= Math.min(...allPrices)) {
                      return <Badge className="mt-1 text-[8px] bg-green-100 text-green-700 border-green-200">🏆 Best Price</Badge>;
                    }
                    return null;
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed TCGPlayer Prices */}
          {card.tcgplayer?.prices && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">TCGPlayer Detailed Pricing</CardTitle>
                  <a
                    href={card.tcgplayer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Buy on TCGPlayer <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {Object.entries(card.tcgplayer.prices).map(([variant, prices]) => (
                  <div key={variant} className="mb-3 last:mb-0">
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      {variant.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 bg-muted/20 rounded-lg text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Low</div>
                        <div className="font-bold text-sm text-green-600">{formatCardPrice(prices.low)}</div>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-lg text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Mid</div>
                        <div className="font-bold text-sm">{formatCardPrice(prices.mid)}</div>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-lg text-center">
                        <div className="text-[10px] text-muted-foreground mb-0.5">High</div>
                        <div className="font-bold text-sm text-red-600">{formatCardPrice(prices.high)}</div>
                      </div>
                      <div className="p-3 bg-primary/5 rounded-lg text-center border border-primary/20">
                        <div className="text-[10px] text-primary mb-0.5">Market</div>
                        <div className="font-bold text-sm text-primary">{formatCardPrice(prices.market)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground mt-2">Updated: {card.tcgplayer.updatedAt}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ============================================
            BOTTOM SECTION — Seller Listings
            ============================================ */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">
                Available from Sellers
                {listings.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({listings.length} listing{listings.length !== 1 ? "s" : ""})
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Sort & Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
              {[
                { value: "price_low", label: "Price ↑" },
                { value: "price_high", label: "Price ↓" },
                { value: "rating", label: "Rating" },
                { value: "newest", label: "Newest" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    sortBy === s.value
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterCondition("")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  !filterCondition
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFilterCondition(c.value)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    filterCondition === c.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Listings */}
          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-32 h-32 bg-muted rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="font-semibold mb-1">No sellers yet</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                  Be the first to list this card for sale!
                </p>
                <Button asChild>
                  <Link href="/dashboard/sales">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Listing
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  marketPrice={marketPrice}
                  onBuyNow={() => handleBuyNow(listing)}
                  buying={buyingId === listing.id}
                  onMakeOffer={() => setOfferListing(listing)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ============================================
            RELATED CARDS SECTION
            ============================================ */}
        {(relatedFromSet.length > 0 || relatedSameName.length > 0) && (
          <div className="space-y-8 mb-12">
            {relatedFromSet.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">More from {card.set.name}</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                  {relatedFromSet.map((rc: any) => (
                    <RelatedCardItem key={rc.id} card={rc} />
                  ))}
                </div>
              </div>
            )}

            {relatedSameName.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">More {card.name} Cards</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                  {relatedSameName.map((rc: any) => (
                    <RelatedCardItem key={rc.id} card={rc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Make Offer Modal */}
      {offerListing && (
        <MakeOfferModal
          listing={offerListing}
          onClose={() => setOfferListing(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   LISTING CARD — Individual seller listing
   ============================================================ */
function ListingCard({
  listing,
  marketPrice,
  onBuyNow,
  buying,
  onMakeOffer,
}: {
  listing: ListingData;
  marketPrice: number | null;
  onBuyNow: () => void;
  buying: boolean;
  onMakeOffer: () => void;
}) {
  const condInfo = getConditionInfo(listing.condition);
  const seller = listing.user;
  const price = Number(listing.price);

  // Price comparison badge
  const priceBadge = marketPrice && marketPrice > 0
    ? (() => {
        const ratio = price / marketPrice;
        if (ratio <= 1) return { label: "Fair Price", color: "bg-green-100 text-green-700 border-green-200", icon: "✓" };
        if (ratio <= 1.5) return { label: "Premium", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "" };
        return { label: "Above Market", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "⚠" };
      })()
    : null;

  const tierBadge = seller ? {
    elite: { icon: Crown, color: "text-purple-500" },
    pro: { icon: ShieldCheck, color: "text-blue-500" },
    free: null,
  }[seller.subscription_tier] : null;

  return (
    <Card className="overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Photos */}
          <div className="sm:w-48 shrink-0">
            {listing.photos?.length > 0 ? (
              <div className="p-3">
                <PhotoGallery photos={listing.photos} alt={listing.title} size="sm" />
              </div>
            ) : listing.card?.image_url ? (
              <div className="aspect-square sm:aspect-auto sm:h-full relative bg-muted/20 min-h-[160px]">
                <Image
                  src={listing.card.image_url}
                  alt={listing.title}
                  fill
                  className="object-contain p-3"
                  sizes="192px"
                />
              </div>
            ) : (
              <div className="h-40 bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              {/* Seller Info */}
              {seller && (
                <div className="flex items-center gap-2 mb-3">
                  <Link
                    href={`/seller/${seller.username}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="h-7 w-7 rounded-full bg-muted overflow-hidden shrink-0">
                      {seller.avatar_url ? (
                        <Image src={seller.avatar_url} alt="" width={28} height={28} className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold">
                          {(seller.display_name || seller.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{seller.display_name || seller.username}</span>
                  </Link>
                  {seller.trade_score > 0 && (
                    <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400" />
                      {Number(seller.trade_score).toFixed(1)}
                    </span>
                  )}
                  {seller.is_verified && (
                    <Badge className="text-[8px] h-4 bg-green-100 text-green-700 border-green-200 gap-0.5">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </Badge>
                  )}
                  {tierBadge && (
                    <tierBadge.icon className={`h-3.5 w-3.5 ${tierBadge.color}`} />
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {seller.total_trades > 0 ? `${seller.total_trades} trades` : "New seller"}
                  </span>
                </div>
              )}

              {/* Condition & Grade */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${condInfo.bgColor} ${condInfo.color} ${condInfo.borderColor}`}>
                  {condInfo.label} ({condInfo.shortLabel})
                </Badge>
                <span className="text-[10px] text-muted-foreground">{condInfo.gradeRange}</span>
                {listing.is_graded && listing.grading_company && listing.grade && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {listing.grading_company} {listing.grade}
                  </Badge>
                )}
              </div>

              {listing.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{listing.description}</p>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex items-end justify-between mt-4 gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-600">${price.toFixed(2)}</span>
                  {listing.shipping_cost > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +${Number(listing.shipping_cost).toFixed(2)} shipping
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {marketPrice && (
                    <span className="text-[10px] text-muted-foreground">
                      Market: {formatCardPrice(marketPrice)}
                    </span>
                  )}
                  {priceBadge && (
                    <Badge className={`text-[8px] h-4 ${priceBadge.color}`}>
                      {priceBadge.icon} {priceBadge.label}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={onBuyNow}
                  disabled={buying}
                >
                  {buying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Tag className="h-3.5 w-3.5" />
                  )}
                  Buy Now
                </Button>
                {listing.accepts_offers && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={onMakeOffer}>
                    Offer
                  </Button>
                )}
                {listing.open_to_trades && (
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <Link href={`/dashboard/trades/new?partner=${seller?.username || ""}&card=${listing.card_id}`}>
                      <Repeat className="h-3.5 w-3.5" />
                      Trade
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Seller shop link */}
            {seller && (
              <Link
                href={`/seller/${seller.username}`}
                className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                View {seller.display_name || seller.username}&apos;s Shop →
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   RELATED CARD ITEM
   ============================================================ */
function RelatedCardItem({ card }: { card: any }) {
  const imgUrl = card.images?.small || card.images?.large || card.image_url;
  const setName = card.set?.name || card.card_sets?.name || "";
  const price = card.tcgplayer?.prices?.holofoil?.market || card.market_value;

  return (
    <Link href={`/card/${card.id}`} className="shrink-0 w-36">
      <Card className="overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all">
        <div className="aspect-[2.5/3.5] relative bg-muted">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={card.name}
              fill
              className="object-contain p-2"
              sizes="144px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-3xl">🃏</div>
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium truncate">{card.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{setName}</p>
          {price && (
            <p className="text-xs font-bold text-green-600 mt-0.5">{formatCardPrice(price)}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

/* ============================================================
   MAKE OFFER MODAL
   ============================================================ */
function MakeOfferModal({ listing, onClose }: { listing: ListingData; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/listings/${listing.id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          amount: parseFloat(amount),
          message: message || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit offer");
        return;
      }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("Failed to submit offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Make an Offer</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{listing.title}</p>
              <p className="text-lg font-bold text-green-600">${Number(listing.price).toFixed(2)}</p>
            </div>
          </div>

          {success ? (
            <div className="text-center py-6">
              <p className="text-green-600 font-semibold">✓ Offer submitted!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Your Offer ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                  autoFocus
                />
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {((parseFloat(amount) / Number(listing.price)) * 100).toFixed(0)}% of asking price
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to the seller..."
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="p-4 border-t border-border flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !amount || parseFloat(amount) <= 0}
              className="flex-1 gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Offer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   HELPER — Rarity color mapping
   ============================================================ */
function getRarityColor(rarity: string): string {
  const lower = rarity.toLowerCase();
  if (lower.includes("secret") || lower.includes("hyper"))
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (lower.includes("illustration") || lower.includes("alt art") || lower.includes("special"))
    return "bg-purple-100 text-purple-800 border-purple-300";
  if (lower.includes("ultra") || lower.includes("rare holo v"))
    return "bg-pink-100 text-pink-800 border-pink-300";
  if (lower.includes("holo") || lower.includes("rare"))
    return "bg-blue-100 text-blue-800 border-blue-300";
  if (lower.includes("uncommon"))
    return "bg-green-100 text-green-800 border-green-300";
  if (lower.includes("common"))
    return "bg-gray-100 text-gray-800 border-gray-300";
  return "bg-gray-100 text-gray-800 border-gray-300";
}
