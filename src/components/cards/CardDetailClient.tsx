"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, TrendingUp, TrendingDown, BarChart3,
  Plus, Heart, Repeat, ShoppingBag, Share2, Shield, Award, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TCGCard } from "@/lib/pokemon-tcg";
import { getMarketPrice, formatCardPrice } from "@/lib/pokemon-tcg";

interface CardDetailClientProps {
  card: TCGCard;
}

type Tab = "market" | "graded" | "pop";

export function CardDetailClient({ card }: CardDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("market");
  const marketPrice = getMarketPrice(card);

  const tabs = [
    { id: "market" as Tab, label: "Market Prices", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    { id: "graded" as Tab, label: "Graded Values", icon: <Award className="h-3.5 w-3.5" /> },
    { id: "pop" as Tab, label: "Population", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back nav */}
        <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* Left: Card Image + Quick Actions */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="sticky top-28"
            >
              {/* Card Image */}
              <Card className="overflow-hidden mb-4">
                <div className="relative aspect-[2.5/3.5] bg-muted/20">
                  {(card.images?.large || card.images?.small) ? (
                    <Image
                      src={card.images.large || card.images.small}
                      alt={card.name}
                      fill
                      className="object-contain p-4"
                      sizes="380px"
                      priority
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl">🃏</div>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button className="w-full" asChild>
                  <Link href="/register">
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Collection
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">
                    <Heart className="h-4 w-4 mr-1" />
                    Want List
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">
                    <Repeat className="h-4 w-4 mr-1" />
                    Find Trades
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    List for Sale
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right: Card Info + Pricing Tabs */}
          <div>
            {/* Card Header */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{card.name}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{card.set.name}</span>
                    <span>·</span>
                    <span>#{card.number}</span>
                    {card.set.images?.symbol && (
                      <Image src={card.set.images.symbol} alt="" width={16} height={16} className="opacity-60" />
                    )}
                  </div>
                </div>
                {marketPrice && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{formatCardPrice(marketPrice)}</div>
                    <div className="text-xs text-muted-foreground">Market Price</div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {card.rarity && <Badge variant="secondary">{card.rarity}</Badge>}
                {card.supertype && <Badge variant="outline">{card.supertype}</Badge>}
                {card.hp && <Badge variant="outline">HP {card.hp}</Badge>}
                {card.artist && <Badge variant="outline">🎨 {card.artist}</Badge>}
              </div>
            </motion.div>

            {/* Pricing Tabs */}
            <div className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "market" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* TCGPlayer Prices */}
                {card.tcgplayer?.prices && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          🏪 TCGPlayer
                        </CardTitle>
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
                              <div className="font-bold text-sm text-success">{formatCardPrice(prices.low)}</div>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-lg text-center">
                              <div className="text-[10px] text-muted-foreground mb-0.5">Mid</div>
                              <div className="font-bold text-sm">{formatCardPrice(prices.mid)}</div>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-lg text-center">
                              <div className="text-[10px] text-muted-foreground mb-0.5">High</div>
                              <div className="font-bold text-sm text-destructive">{formatCardPrice(prices.high)}</div>
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

                {/* CardMarket (EU) */}
                {card.cardmarket?.prices && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          🇪🇺 CardMarket (Europe)
                        </CardTitle>
                        <a
                          href={card.cardmarket.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View on CardMarket <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/20 rounded-lg text-center">
                          <div className="text-[10px] text-muted-foreground mb-0.5">Low</div>
                          <div className="font-bold text-sm text-success">€{card.cardmarket.prices.lowPrice?.toFixed(2) || "—"}</div>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-lg text-center">
                          <div className="text-[10px] text-muted-foreground mb-0.5">Avg Sell</div>
                          <div className="font-bold text-sm">€{card.cardmarket.prices.averageSellPrice?.toFixed(2) || "—"}</div>
                        </div>
                        <div className="p-3 bg-primary/5 rounded-lg text-center border border-primary/20">
                          <div className="text-[10px] text-primary mb-0.5">Trend</div>
                          <div className="font-bold text-sm text-primary">€{card.cardmarket.prices.trendPrice?.toFixed(2) || "—"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* eBay */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      🔨 eBay Sold Listings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + " " + card.set.name + " pokemon")}&LH_Complete=1&LH_Sold=1&_sop=13`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                      <span>View recent sold listings on eBay</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">Live Data</Badge>
                    </a>
                  </CardContent>
                </Card>

                {/* Poké-Trade Marketplace */}
                <Card className="border-primary/20">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">Available on Poké-Trade</h3>
                        <p className="text-xs text-muted-foreground">Buy from verified sellers with 3-5% fees</p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href="/marketplace">Browse Listings</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "graded" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Graded Card Values</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Estimated graded values based on eBay sold data (powered by PokeTrace + PokemonPriceTracker Pro).
                    </p>
                    <div className="space-y-2">
                      {[
                        { grade: "PSA 10 / BGS 9.5", multiplier: 5, label: "Gem Mint" },
                        { grade: "PSA 9 / BGS 9", multiplier: 2.5, label: "Mint" },
                        { grade: "PSA 8 / BGS 8", multiplier: 1.5, label: "NM-MT" },
                        { grade: "PSA 7 / BGS 7", multiplier: 1.1, label: "Near Mint" },
                        { grade: "PSA 6 / BGS 6", multiplier: 0.8, label: "EX-MT" },
                        { grade: "Raw Near Mint", multiplier: 1, label: "Ungraded" },
                      ].map((row) => {
                        const estimatedPrice = marketPrice ? marketPrice * row.multiplier : null;
                        return (
                          <div key={row.grade} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors">
                            <div>
                              <div className="font-semibold text-sm">{row.grade}</div>
                              <div className="text-xs text-muted-foreground">{row.label}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-sm ${row.multiplier > 1 ? "text-success" : row.multiplier < 1 ? "text-muted-foreground" : "text-foreground"}`}>
                                {estimatedPrice ? formatCardPrice(estimatedPrice) : "—"}
                              </div>
                              {row.multiplier !== 1 && (
                                <div className="text-[10px] text-muted-foreground">
                                  {row.multiplier > 1 ? `${row.multiplier}x raw` : `${row.multiplier}x raw`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      * Estimates based on typical grade multipliers. Actual prices vary by card popularity, print run, and market conditions.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-success" />
                      <h3 className="font-semibold text-sm">Get This Card Graded</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Use our authentication service to grade and verify your card.
                    </p>
                    <Button size="sm" variant="outline" className="text-success border-success/30" asChild>
                      <Link href="/protect">Learn About Grading</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "pop" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Population Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      PSA population data shows how many copies have been graded at each level.
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { grade: "PSA 10", count: "—", pct: 0, color: "bg-success" },
                        { grade: "PSA 9", count: "—", pct: 0, color: "bg-primary" },
                        { grade: "PSA 8", count: "—", pct: 0, color: "bg-secondary" },
                        { grade: "PSA 7", count: "—", pct: 0, color: "bg-warning" },
                        { grade: "PSA 6", count: "—", pct: 0, color: "bg-muted-foreground" },
                        { grade: "PSA 1-5", count: "—", pct: 0, color: "bg-muted" },
                      ].map((row) => (
                        <div key={row.grade} className="flex items-center gap-3">
                          <span className="text-xs font-mono w-16">{row.grade}</span>
                          <div className="flex-1 h-6 bg-muted/20 rounded overflow-hidden">
                            <div className={`h-full ${row.color} rounded`} style={{ width: `${row.pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">{row.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-muted/10 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Population data is available through our PokemonPriceTracker Pro integration.
                        <Link href="/register" className="text-primary hover:underline ml-1">Sign up</Link> to access full pop reports for every card.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Why Population Matters</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lower population = higher scarcity = potentially higher value. A card with only 50 PSA 10s is worth significantly more than one with 5,000. Use pop data to make smarter investment decisions.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Card Details */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Card Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-muted/10 rounded">
                    <div className="text-[10px] text-muted-foreground">Name</div>
                    <div className="font-medium">{card.name}</div>
                  </div>
                  <div className="p-2 bg-muted/10 rounded">
                    <div className="text-[10px] text-muted-foreground">Set</div>
                    <div className="font-medium">{card.set.name}</div>
                  </div>
                  <div className="p-2 bg-muted/10 rounded">
                    <div className="text-[10px] text-muted-foreground">Number</div>
                    <div className="font-medium">#{card.number}</div>
                  </div>
                  <div className="p-2 bg-muted/10 rounded">
                    <div className="text-[10px] text-muted-foreground">Rarity</div>
                    <div className="font-medium">{card.rarity || "—"}</div>
                  </div>
                  {card.hp && (
                    <div className="p-2 bg-muted/10 rounded">
                      <div className="text-[10px] text-muted-foreground">HP</div>
                      <div className="font-medium">{card.hp}</div>
                    </div>
                  )}
                  {card.artist && (
                    <div className="p-2 bg-muted/10 rounded">
                      <div className="text-[10px] text-muted-foreground">Illustrator</div>
                      <div className="font-medium">{card.artist}</div>
                    </div>
                  )}
                  <div className="p-2 bg-muted/10 rounded">
                    <div className="text-[10px] text-muted-foreground">Series</div>
                    <div className="font-medium">{card.set.series}</div>
                  </div>
                  <div className="p-2 bg-muted/10 rounded">
                    <div className="text-[10px] text-muted-foreground">Release Date</div>
                    <div className="font-medium">{card.set.releaseDate || "—"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
