"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, LayoutGrid, Grid3X3, ArrowUpDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MarketCard {
  id: string;
  name: string;
  number: string;
  rarity: string;
  hp?: string;
  illustrator?: string;
  supertype?: string;
  subtypes?: string[];
  images: { small: string; large: string };
  set: {
    id: string;
    name: string;
    series: string;
    images: { symbol: string; logo: string };
  };
  tcgplayer?: { prices: { holofoil?: { market: number } } };
  cardmarket?: { prices: { averageSellPrice: number } };
}

const RARITY_FILTERS = ["All", "Common", "Uncommon", "Rare Holo", "Rare Ultra", "Rare Holo V", "Rare Holo VMAX", "Illustration Rare", "Rare Secret", "Rare Holo Star"];
const SORT_OPTIONS = [
  { value: "value-desc", label: "Price: High → Low" },
  { value: "value-asc", label: "Price: Low → High" },
  { value: "name-asc", label: "Name: A → Z" },
  { value: "name-desc", label: "Name: Z → A" },
  { value: "newest", label: "Newest First" },
];

function getPrice(card: MarketCard): number | null {
  return card.tcgplayer?.prices?.holofoil?.market
    ?? card.cardmarket?.prices?.averageSellPrice
    ?? null;
}

function formatPrice(price: number | null): string {
  if (!price) return "—";
  return `$${price.toFixed(2)}`;
}

export function MarketplaceClient() {
  const [cards, setCards] = useState<MarketCard[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sort, setSort] = useState("value-desc");
  const [loading, setLoading] = useState(true);
  const [gridSize, setGridSize] = useState<"sm" | "lg">("lg");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSort, setShowSort] = useState(false);

  const fetchCards = useCallback(async (p: number, q: string, rarity: string, sortBy: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        sort: sortBy,
      });
      if (q) params.set("q", q);
      if (rarity && rarity !== "All") params.set("rarity", rarity);

      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      setCards(data.cards || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      // keep existing
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCards(page, search, activeFilter, sort);
  }, [page, activeFilter, sort, fetchCards]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCards(1, search, activeFilter, sort);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleSortChange = (s: string) => {
    setSort(s);
    setPage(1);
    setShowSort(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-primary">Marketplace</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse {total.toLocaleString()} Pokémon cards from our database
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
                {loading ? "..." : "Search"}
              </Button>
            </form>
            <div className="flex gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <Button variant="outline" size="icon" onClick={() => setShowSort(!showSort)}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                {showSort && (
                  <div className="absolute right-0 top-11 z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px]">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange(opt.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${sort === opt.value ? "text-primary font-medium" : "text-foreground"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                onClick={() => handleFilterChange(filter)}
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

        {/* Results count + pagination info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} cards found — Page {page} of {totalPages}
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No cards found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Card Grid */}
            <div className={`grid gap-4 ${
              gridSize === "lg"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            }`}>
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.4) }}
                >
                  <Link href={`/card/${card.id}`}>
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
                            {formatPrice(getPrice(card))}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
