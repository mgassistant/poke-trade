"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Wallet, Plus, Search, X, Filter, ChevronLeft, ChevronRight,
  Trash2, Grid, SortAsc, Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CardScanner from "@/components/cards/CardScanner";
import { CONDITIONS as CONDITION_LIST, getConditionInfo, getConditionValue } from "@/lib/constants/conditions";

interface CardData {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  card_type: string | null;
  image_url: string | null;
  market_value: number | null;
  set_id: string;
  card_sets: {
    id: string;
    name: string;
    series: string;
    symbol_url: string | null;
  } | null;
}

interface CollectionItemData {
  id: string;
  collection_id: string;
  card_id: string;
  quantity: number;
  condition: string;
  current_value: number | null;
  created_at: string;
  cards: CardData;
}

interface CollectionData {
  id: string;
  name: string;
  collection_items: CollectionItemData[];
}

const CONDITIONS = CONDITION_LIST.map((c) => c.label);
const CONDITION_MAP: Record<string, string> = Object.fromEntries(
  CONDITION_LIST.map((c) => [c.label, c.value])
);
const CONDITION_REVERSE: Record<string, string> = Object.fromEntries(
  CONDITION_LIST.map((c) => [c.value, `${c.shortLabel}`])
);

type SortOption = "value-desc" | "value-asc" | "name-asc" | "name-desc" | "date-desc";

export default function CollectionPage() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardData[]>([]);
  const [searching, setSearching] = useState(false);
  const [addCondition, setAddCondition] = useState("Near Mint");
  const [addQuantity, setAddQuantity] = useState(1);
  const [adding, setAdding] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Filters
  const [filterSet, setFilterSet] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 40;

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch("/api/collection");
      const data = await res.json();
      if (data.collections) setCollections(data.collections);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  // Search cards
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/cards/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        const data = await res.json();
        if (data.cards) setSearchResults(data.cards);
      } catch {
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Flatten all items
  const allItems = collections.flatMap((c) =>
    (c.collection_items || []).map((item) => ({
      ...item,
      collectionName: c.name,
    }))
  );

  // Filter
  let filtered = allItems;
  if (filterSet) {
    filtered = filtered.filter((i) => i.cards?.card_sets?.name === filterSet);
  }
  if (filterRarity) {
    filtered = filtered.filter((i) => i.cards?.rarity === filterRarity);
  }
  if (filterType) {
    filtered = filtered.filter((i) => i.cards?.card_type === filterType);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "value-desc":
        return ((b.current_value || b.cards?.market_value || 0) - (a.current_value || a.cards?.market_value || 0));
      case "value-asc":
        return ((a.current_value || a.cards?.market_value || 0) - (b.current_value || b.cards?.market_value || 0));
      case "name-asc":
        return (a.cards?.name || "").localeCompare(b.cards?.name || "");
      case "name-desc":
        return (b.cards?.name || "").localeCompare(a.cards?.name || "");
      case "date-desc":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Stats
  const totalCards = allItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalValue = allItems.reduce((sum, i) => {
    const val = i.current_value || i.cards?.market_value || 0;
    return sum + val * (i.quantity || 1);
  }, 0);
  const uniqueSets = new Set(allItems.map((i) => i.cards?.card_sets?.name).filter(Boolean)).size;

  // Pagination
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Available filter values
  const availableSets = [...new Set(allItems.map((i) => i.cards?.card_sets?.name).filter(Boolean))].sort() as string[];
  const availableRarities = [...new Set(allItems.map((i) => i.cards?.rarity).filter(Boolean))].sort() as string[];
  const availableTypes = [...new Set(allItems.map((i) => i.cards?.card_type).filter(Boolean))].sort() as string[];

  const handleAddCard = async (cardId: string) => {
    if (!collections.length) {
      // Create default collection first
      setAdding(cardId);
      try {
        const createRes = await fetch("/api/collection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_collection", name: "My Collection" }),
        });
        const created = await createRes.json();
        if (created.collection) {
          await addToCollection(created.collection.id, cardId);
        }
      } catch {
      } finally {
        setAdding(null);
      }
      return;
    }
    setAdding(cardId);
    await addToCollection(collections[0].id, cardId);
    setAdding(null);
  };

  const addToCollection = async (collectionId: string, cardId: string) => {
    try {
      await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          collection_id: collectionId,
          card_id: cardId,
          condition: CONDITION_MAP[addCondition] || "near_mint",
          quantity: addQuantity,
        }),
      });
      fetchCollection();
      setSearchQuery("");
      setSearchResults([]);
    } catch {
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // We need a DELETE endpoint — use existing collection route with action
    try {
      await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_item", item_id: itemId }),
      });
      fetchCollection();
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Collection</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your card collection</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowScanner(true)} variant="outline" className="gap-2">
            <Camera className="h-4 w-4" /> Scan Card
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Card
          </Button>
        </div>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            {loading ? <Skeleton className="h-7 w-16 mx-auto" /> : (
              <div className="text-xl font-bold">{totalCards.toLocaleString()}</div>
            )}
            <div className="text-xs text-muted-foreground">Total Cards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            {loading ? <Skeleton className="h-7 w-20 mx-auto" /> : (
              <div className="text-xl font-bold">${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <div className="text-xs text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            {loading ? <Skeleton className="h-7 w-12 mx-auto" /> : (
              <div className="text-xl font-bold">{uniqueSets}</div>
            )}
            <div className="text-xs text-muted-foreground">Unique Sets</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="h-3 w-3" /> Filters
        </Button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
        >
          <option value="date-desc">Newest First</option>
          <option value="value-desc">Highest Value</option>
          <option value="value-asc">Lowest Value</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {totalFiltered} card{totalFiltered !== 1 ? "s" : ""}
        </span>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Set</label>
                <select
                  value={filterSet}
                  onChange={(e) => { setFilterSet(e.target.value); setPage(1); }}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                >
                  <option value="">All Sets</option>
                  {availableSets.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rarity</label>
                <select
                  value={filterRarity}
                  onChange={(e) => { setFilterRarity(e.target.value); setPage(1); }}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                >
                  <option value="">All Rarities</option>
                  {availableRarities.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                >
                  <option value="">All Types</option>
                  {availableTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {(filterSet || filterRarity || filterType) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => { setFilterSet(""); setFilterRarity(""); setFilterType(""); setPage(1); }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="aspect-[2.5/3.5] w-full rounded-md mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">
              {allItems.length === 0 ? "No cards in your collection" : "No cards match your filters"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              {allItems.length === 0
                ? "Start building your collection by adding your first card!"
                : "Try adjusting your filters to see more cards."
              }
            </p>
            {allItems.length === 0 && (
              <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Your First Card
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {paginated.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden">
              <CardContent className="p-3">
                {item.cards?.image_url ? (
                  <div className="aspect-[2.5/3.5] relative mb-2 rounded-md overflow-hidden bg-muted">
                    <Image
                      src={item.cards.image_url}
                      alt={item.cards.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-[2.5/3.5] bg-muted rounded-md mb-2 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}
                <h3 className="font-medium text-sm truncate">{item.cards?.name || "Unknown"}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {item.cards?.card_sets?.name || ""} · #{item.cards?.number}
                </p>
                <div className="flex items-center justify-between mt-2">
                  {(() => {
                    const ci = getConditionInfo(item.condition);
                    return (
                      <Badge variant="outline" className={`text-[10px] ${ci.color} ${ci.borderColor}`}>
                        {ci.shortLabel}
                      </Badge>
                    );
                  })()}
                  <span className="text-xs font-medium">
                    ${((item.current_value || item.cards?.market_value || 0)).toFixed(2)}
                  </span>
                </div>
                {item.quantity > 1 && (
                  <Badge className="text-[10px] mt-1">×{item.quantity}</Badge>
                )}
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from collection"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Add Card to Collection</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cards by name..."
                  className="pl-10"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 mt-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">Condition</label>
                  <select
                    value={addCondition}
                    onChange={(e) => setAddCondition(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                  >
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted-foreground block mb-1">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {searching ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-14 w-10 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery.length >= 2
                      ? "No cards found. Try a different search."
                      : "Type at least 2 characters to search..."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {card.image_url ? (
                        <div className="h-14 w-10 relative rounded overflow-hidden bg-muted shrink-0">
                          <Image
                            src={card.image_url}
                            alt={card.name}
                            fill
                            className="object-contain"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                          <Wallet className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {card.card_sets?.name || ""} · #{card.number}
                          {card.rarity && ` · ${card.rarity}`}
                        </p>
                        {card.market_value != null && (
                          <p className="text-xs text-green-400">${card.market_value.toFixed(2)}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={adding === card.id}
                        onClick={() => handleAddCard(card.id)}
                      >
                        {adding === card.id ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Scanner Modal */}
      <CardScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onAddCard={async (cardId, condition, quantity) => {
          if (!collections.length) {
            const createRes = await fetch("/api/collection", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "create_collection", name: "My Collection" }),
            });
            const created = await createRes.json();
            if (created.collection) {
              await fetch("/api/collection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "add_item",
                  collection_id: created.collection.id,
                  card_id: cardId,
                  condition,
                  quantity,
                }),
              });
            }
          } else {
            await fetch("/api/collection", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "add_item",
                collection_id: collections[0].id,
                card_id: cardId,
                condition,
                quantity,
              }),
            });
          }
          fetchCollection();
        }}
      />
    </div>
  );
}
