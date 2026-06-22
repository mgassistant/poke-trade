"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TCGCard, TCGSet } from "@/lib/pokemon-tcg";
import { getMarketPrice, formatCardPrice } from "@/lib/pokemon-tcg";

interface PriceGuideClientProps {
  initialCards: TCGCard[];
  sets: TCGSet[];
}

export function PriceGuideClient({ initialCards, sets }: PriceGuideClientProps) {
  const [cards, setCards] = useState(initialCards);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"cards" | "sets">("cards");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${search}"&pageSize=20&orderBy=-set.releaseDate`);
      const data = await res.json();
      setCards(data.data || []);
    } catch { /* keep existing */ }
    setLoading(false);
  };

  const sortedCards = [...cards].sort((a, b) => {
    const priceA = getMarketPrice(a) || 0;
    const priceB = getMarketPrice(b) || 0;
    return priceB - priceA;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-primary">Price Guide</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Real-time Pokémon card market values powered by TCGPlayer data
          </p>
        </div>

        {/* Search */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search card prices... (e.g. Charizard, Umbreon)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView("cards")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                view === "cards" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Top Cards
            </button>
            <button
              onClick={() => setView("sets")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                view === "sets" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Sets
            </button>
          </div>
        </div>

        {view === "cards" ? (
          /* Card Price Table */
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-border/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-12" />
              <div>Card</div>
              <div className="hidden sm:block">Set</div>
              <div>Rarity</div>
              <div className="text-right">Market Price</div>
            </div>
            {sortedCards.map((card, i) => {
              const price = getMarketPrice(card);
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-border/10 hover:bg-muted/20 transition-colors items-center"
                >
                  <div className="w-12 h-16 relative rounded overflow-hidden bg-muted/20">
                    <Image
                      src={card.images.small}
                      alt={card.name}
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{card.name}</div>
                    <div className="text-xs text-muted-foreground">#{card.number}</div>
                  </div>
                  <div className="hidden sm:block text-sm text-muted-foreground truncate max-w-[150px]">
                    {card.set.name}
                  </div>
                  <div>
                    <Badge variant="outline" className="text-[10px]">
                      {card.rarity || "—"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-sm ${price ? "text-primary" : "text-muted-foreground"}`}>
                      {formatCardPrice(price)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Sets Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sets.map((set, i) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
              >
                <Card className="hover:border-primary/30 transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    {set.images?.logo && (
                      <div className="h-16 flex items-center justify-center mb-4">
                        <Image
                          src={set.images.logo}
                          alt={set.name}
                          width={120}
                          height={48}
                          className="max-h-12 w-auto object-contain"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-sm">{set.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{set.series}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        {set.total} cards
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {set.releaseDate}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
