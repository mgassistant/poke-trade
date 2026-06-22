"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Grid3X3, LayoutGrid, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TCGCard } from "@/lib/pokemon-tcg";
import { getMarketPrice, formatCardPrice } from "@/lib/pokemon-tcg";

interface MarketplaceClientProps {
  initialCards: TCGCard[];
}

const RARITY_FILTERS = ["All", "Common", "Uncommon", "Rare", "Rare Holo", "Rare Ultra", "Illustration Rare"];

export function MarketplaceClient({ initialCards }: MarketplaceClientProps) {
  const [cards, setCards] = useState(initialCards);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [gridSize, setGridSize] = useState<"sm" | "lg">("lg");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${search}"&pageSize=20&orderBy=-set.releaseDate`);
      const data = await res.json();
      setCards(data.data || []);
    } catch {
      // keep existing cards
    }
    setLoading(false);
  };

  const filteredCards = activeFilter === "All"
    ? cards
    : cards.filter((c) => c.rarity === activeFilter);

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-primary">Marketplace</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse Pokémon cards from trusted sellers worldwide
          </p>
        </div>

        {/* Search + Filters Bar */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards... (e.g. Charizard, Pikachu)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </form>
            <div className="flex gap-2">
              <Button
                variant={gridSize === "lg" ? "default" : "outline"}
                size="icon"
                onClick={() => setGridSize("lg")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={gridSize === "sm" ? "default" : "outline"}
                size="icon"
                onClick={() => setGridSize("sm")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {RARITY_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredCards.length} cards found
          </p>
        </div>

        {/* Card Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No cards found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            gridSize === "lg"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
          }`}>
            {filteredCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.5) }}
              >
                <Link href={`/marketplace/${card.id}`}>
                  <Card className="group cursor-pointer hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,212,255,0.1)] overflow-hidden">
                    <CardContent className="p-3">
                      <div className="relative aspect-[2.5/3.5] bg-muted/30 rounded-lg overflow-hidden mb-3">
                        <Image
                          src={card.images.large || card.images.small}
                          alt={card.name}
                          fill
                          className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                          sizes={gridSize === "lg" ? "(max-width: 640px) 50vw, 20vw" : "(max-width: 640px) 33vw, 16vw"}
                        />
                      </div>
                      {card.rarity && (
                        <Badge variant="outline" className="text-[10px] mb-1.5 border-primary/30 text-primary/80">
                          {card.rarity}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-sm truncate">{card.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{card.set.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-primary font-bold text-sm">
                          {formatCardPrice(getMarketPrice(card))}
                        </span>
                        {card.set.images?.symbol && (
                          <Image
                            src={card.set.images.symbol}
                            alt=""
                            width={14}
                            height={14}
                            className="opacity-40"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
