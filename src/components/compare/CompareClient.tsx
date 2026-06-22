"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpDown, ExternalLink, TrendingUp, TrendingDown, Minus, Shield, Zap, Globe, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AVAILABLE_APIS } from "@/lib/price-sources";

interface CardPriceResult {
  id: string;
  name: string;
  set: { name: string; images: { symbol: string } };
  images: { small: string; large: string };
  rarity: string | null;
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: Record<string, {
      low: number | null;
      mid: number | null;
      high: number | null;
      market: number | null;
    }>;
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: {
      averageSellPrice: number | null;
      lowPrice: number | null;
      trendPrice: number | null;
    };
  };
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "—";
  return `$${price.toFixed(2)}`;
}

export function CompareClient() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CardPriceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardPriceResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelectedCard(null);

    try {
      // Try our Pro API first (PokemonPriceTracker with TCGPlayer CDN images)
      const proRes = await fetch(`/api/prices?search=${encodeURIComponent(search)}&limit=12&includeEbay=true`);
      const proData = await proRes.json();

      if (proData.data?.length > 0) {
        // Map Pro API response to our card format
        const mapped = proData.data.map((card: any) => ({
          id: card.tcgPlayerId || card.id,
          name: card.name,
          set: { name: card.setName, images: { symbol: "" } },
          images: { small: card.images?.small || "", large: card.images?.large || card.images?.medium || "" },
          rarity: card.rarity,
          tcgplayer: card.tcgplayer ? {
            url: card.tcgplayer.url,
            updatedAt: card.tcgplayer.lastUpdated,
            prices: card.tcgplayer.variants || { market: { market: card.tcgplayer.market, low: card.tcgplayer.low, mid: null, high: null } },
          } : undefined,
          cardmarket: undefined,
          ebayData: card.ebay,
        }));
        setResults(mapped.filter((c: CardPriceResult) => c.images?.small));
      } else {
        // Fallback to Pokemon TCG API
        const res = await fetch(
          `https://api.pokemontcg.io/v2/cards?q=name:"${search}"&pageSize=12&orderBy=-set.releaseDate&select=id,name,set,images,rarity,tcgplayer,cardmarket`
        );
        const data = await res.json();
        setResults((data.data || []).filter((c: CardPriceResult) => c.images?.small));
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-4">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            Multi-Source Comparison
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Price <span className="text-primary">Comparison</span> Tool
          </h1>
          <p className="mt-2 text-muted-foreground">
            Compare prices across TCGPlayer, eBay, and CardMarket — find the best deal in seconds
          </p>
        </div>

        {/* Search */}
        <div className="glass-card rounded-xl p-4 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search any Pokémon card... (e.g. Charizard VMAX, Umbreon Alt Art)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Comparing..." : "Compare Prices"}
            </Button>
          </form>
        </div>

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No cards found</h3>
            <p className="text-muted-foreground">Try a different search term</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Card list */}
          <div className={selectedCard ? "lg:col-span-1" : "lg:col-span-3"}>
            {results.length > 0 && (
              <div className={`grid gap-3 ${selectedCard ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
                {results.map((card, i) => {
                  const marketPrice = card.tcgplayer?.prices
                    ? Object.values(card.tcgplayer.prices)[0]?.market
                    : null;

                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    >
                      <Card
                        className={`cursor-pointer transition-all hover:-translate-y-1 ${
                          selectedCard?.id === card.id
                            ? "border-primary glow-blue"
                            : "hover:border-primary/30"
                        }`}
                        onClick={() => setSelectedCard(card)}
                      >
                        <CardContent className={`p-3 ${selectedCard ? "flex items-center gap-3" : ""}`}>
                          <div className={`relative bg-muted/30 rounded-lg overflow-hidden ${
                            selectedCard ? "w-16 h-20 shrink-0" : "aspect-[2.5/3.5] mb-3"
                          }`}>
                            <Image
                              src={card.images.large || card.images.small}
                              alt={card.name}
                              fill
                              className="object-contain p-1"
                              sizes={selectedCard ? "64px" : "200px"}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{card.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{card.set.name}</p>
                            {marketPrice && (
                              <p className="text-primary font-bold text-sm mt-1">{formatPrice(marketPrice)}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price comparison detail */}
          <AnimatePresence>
            {selectedCard && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-2"
              >
                <Card className="sticky top-28">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-32 relative bg-muted/30 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={selectedCard.images.large || selectedCard.images.small}
                          alt={selectedCard.name}
                          fill
                          className="object-contain p-1"
                          sizes="96px"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{selectedCard.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedCard.set.name}</p>
                        {selectedCard.rarity && (
                          <Badge variant="outline" className="mt-2">{selectedCard.rarity}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* TCGPlayer Prices */}
                    {selectedCard.tcgplayer?.prices && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🏪</span>
                          <h3 className="font-semibold">TCGPlayer</h3>
                          <a
                            href={selectedCard.tcgplayer.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View on TCGPlayer <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(selectedCard.tcgplayer.prices).map(([condition, prices]) => (
                            <div key={condition} className="grid grid-cols-5 gap-2 text-sm p-2 bg-muted/20 rounded-lg">
                              <div className="font-medium text-xs">{condition.replace(/([A-Z])/g, " $1").trim()}</div>
                              <div className="text-center">
                                <div className="text-[10px] text-muted-foreground">Low</div>
                                <div className="text-success">{formatPrice(prices.low)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-muted-foreground">Mid</div>
                                <div>{formatPrice(prices.mid)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-muted-foreground">High</div>
                                <div className="text-destructive">{formatPrice(prices.high)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-muted-foreground">Market</div>
                                <div className="font-bold text-primary">{formatPrice(prices.market)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Updated: {selectedCard.tcgplayer.updatedAt}
                        </p>
                      </div>
                    )}

                    <Separator className="my-4" />

                    {/* CardMarket Prices */}
                    {selectedCard.cardmarket?.prices && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🇪🇺</span>
                          <h3 className="font-semibold">CardMarket (Europe)</h3>
                          <a
                            href={selectedCard.cardmarket.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View on CardMarket <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/20 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground">Low</div>
                            <div className="font-bold text-success">{formatPrice(selectedCard.cardmarket.prices.lowPrice)}</div>
                          </div>
                          <div className="p-3 bg-muted/20 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground">Avg Sell</div>
                            <div className="font-bold">{formatPrice(selectedCard.cardmarket.prices.averageSellPrice)}</div>
                          </div>
                          <div className="p-3 bg-muted/20 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground">Trend</div>
                            <div className="font-bold text-primary">{formatPrice(selectedCard.cardmarket.prices.trendPrice)}</div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Updated: {selectedCard.cardmarket.updatedAt}
                        </p>
                      </div>
                    )}

                    <Separator className="my-4" />

                    {/* eBay + Additional sources */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🔨</span>
                        <h3 className="font-semibold">eBay Sold Listings</h3>
                      </div>
                      <a
                        href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(selectedCard.name + " " + selectedCard.set.name + " pokemon card")}&LH_Complete=1&LH_Sold=1&_sop=13`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors text-sm"
                      >
                        <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                        <span>View recent eBay sold listings for this card</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">Live</Badge>
                      </a>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mt-6">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href="/register">List on Poké-Trade</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href="/register">Add to Collection</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Connected APIs Section */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold mb-2">
            Connected <span className="text-primary">Data Sources</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            We aggregate pricing from every major marketplace to give you the complete picture
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_APIS.map((api) => (
              <Card key={api.name} className="hover:border-primary/20 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{api.name}</h3>
                    <Badge
                      variant={api.status === "active" ? "default" : api.status === "ready" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {api.status === "active" ? "🟢 Live" : api.status === "ready" ? "🟡 Ready" : "📋 Planned"}
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {api.provides.map((item) => (
                      <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-primary/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground">{api.rateLimit}</span>
                    {api.free && <Badge variant="outline" className="text-[10px] text-success border-success/30">Free</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
