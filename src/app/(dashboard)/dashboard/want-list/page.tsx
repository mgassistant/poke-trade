"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Heart, Plus, Search, X, Trash2, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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

interface WantListItemData {
  id: string;
  want_list_id: string;
  card_id: string;
  desired_condition: string | null;
  max_budget: number | null;
  created_at: string;
  cards: CardData;
  hasMatch: boolean;
}

const PRIORITIES = ["High", "Medium", "Low"] as const;
const CONDITIONS = ["Any", "Mint", "Near Mint", "Excellent", "Good", "Played", "Poor"];

export default function WantListPage() {
  const [items, setItems] = useState<WantListItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardData[]>([]);
  const [searching, setSearching] = useState(false);
  const [addCondition, setAddCondition] = useState("Any");
  const [addMaxPrice, setAddMaxPrice] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchWantList = useCallback(async () => {
    try {
      const res = await fetch("/api/want-list");
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWantList();
  }, [fetchWantList]);

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

  const handleAddCard = async (cardId: string) => {
    setAdding(cardId);
    try {
      const res = await fetch("/api/want-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          card_id: cardId,
          desired_condition: addCondition === "Any" ? null : addCondition.toLowerCase().replace(" ", "_"),
          max_budget: addMaxPrice ? parseFloat(addMaxPrice) : null,
        }),
      });
      const data = await res.json();
      if (data.error && res.status === 409) {
        // Already on list
      }
      fetchWantList();
      setSearchQuery("");
      setSearchResults([]);
    } catch {
    } finally {
      setAdding(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemoving(itemId);
    try {
      await fetch("/api/want-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", item_id: itemId }),
      });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
    } finally {
      setRemoving(null);
    }
  };

  const handleUpdateBudget = async (itemId: string, maxBudget: string) => {
    try {
      await fetch("/api/want-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          item_id: itemId,
          max_budget: maxBudget ? parseFloat(maxBudget) : null,
        }),
      });
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Want List</h1>
          <p className="text-muted-foreground text-sm mt-1">Cards you&apos;re looking for</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Card
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            {loading ? <Skeleton className="h-7 w-12 mx-auto" /> : (
              <div className="text-xl font-bold">{items.length}</div>
            )}
            <div className="text-xs text-muted-foreground">Wanted Cards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            {loading ? <Skeleton className="h-7 w-12 mx-auto" /> : (
              <div className="text-xl font-bold text-green-400">{items.filter((i) => i.hasMatch).length}</div>
            )}
            <div className="text-xs text-muted-foreground">Available Now</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            {loading ? <Skeleton className="h-7 w-16 mx-auto" /> : (
              <div className="text-xl font-bold">
                ${items.reduce((sum, i) => sum + (i.max_budget || 0), 0).toFixed(2)}
              </div>
            )}
            <div className="text-xs text-muted-foreground">Total Budget</div>
          </CardContent>
        </Card>
      </div>

      {/* Want List Items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">Your want list is empty</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              Add cards you&apos;re looking for and get notified when they become available.
            </p>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {item.cards?.image_url ? (
                    <div className="h-16 w-12 relative rounded overflow-hidden bg-muted shrink-0">
                      <Image
                        src={item.cards.image_url}
                        alt={item.cards.name}
                        fill
                        className="object-contain"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-12 bg-muted rounded flex items-center justify-center shrink-0">
                      <Heart className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{item.cards?.name || "Unknown"}</h3>
                      {item.hasMatch && (
                        <Badge variant="success" className="text-[10px] shrink-0">
                          <ShoppingBag className="h-3 w-3 mr-1" /> Available
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.cards?.card_sets?.name || ""} · #{item.cards?.number}
                      {item.cards?.rarity && ` · ${item.cards.rarity}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {item.desired_condition && (
                        <Badge variant="outline" className="text-[10px]">
                          {item.desired_condition.replace("_", " ")}
                        </Badge>
                      )}
                      {item.cards?.market_value != null && (
                        <span className="text-xs text-muted-foreground">
                          Market: ${item.cards.market_value.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <label className="text-[10px] text-muted-foreground block">Max Price</label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={item.max_budget || ""}
                        placeholder="—"
                        onBlur={(e) => handleUpdateBudget(item.id, e.target.value)}
                        className="w-20 h-7 rounded border border-border bg-input px-2 text-xs text-foreground text-right"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removing === item.id}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                      title="Remove from want list"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Add to Want List</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

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
                  <label className="text-xs text-muted-foreground block mb-1">Desired Condition</label>
                  <select
                    value={addCondition}
                    onChange={(e) => setAddCondition(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                  >
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="w-28">
                  <label className="text-xs text-muted-foreground block mb-1">Max Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={addMaxPrice}
                    onChange={(e) => setAddMaxPrice(e.target.value)}
                    placeholder="$0.00"
                  />
                </div>
              </div>
            </div>

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
                    {searchQuery.length >= 2 ? "No cards found." : "Type at least 2 characters to search..."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((card) => (
                    <div key={card.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      {card.image_url ? (
                        <div className="h-14 w-10 relative rounded overflow-hidden bg-muted shrink-0">
                          <Image src={card.image_url} alt={card.name} fill className="object-contain" sizes="40px" />
                        </div>
                      ) : (
                        <div className="h-14 w-10 bg-muted rounded shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {card.card_sets?.name || ""} · #{card.number}
                        </p>
                        {card.market_value != null && (
                          <p className="text-xs text-green-400">${card.market_value.toFixed(2)}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" disabled={adding === card.id} onClick={() => handleAddCard(card.id)}>
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
    </div>
  );
}
