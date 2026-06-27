"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Wallet, Plus, Search, X, Filter, ChevronLeft, ChevronRight,
  Trash2, Camera, Lock, Star, Pencil, Heart, CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CardScanner from "@/components/cards/CardScanner";
import AddCardModal from "@/components/cards/AddCardModal";
import { CONDITIONS as CONDITION_LIST, getConditionInfo } from "@/lib/constants/conditions";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  reserved_for_trade_id: string | null;
  is_graded: boolean;
  grading_company: string | null;
  grade: number | null;
  for_trade: boolean;
  cards: CardData;
}

interface CollectionData {
  id: string;
  name: string;
  collection_items: CollectionItemData[];
}

interface SetData {
  id: string;
  name: string;
  series: string;
  symbol_url: string | null;
  logo_url: string | null;
  total_cards: number;
  collected_count: number;
  collected_value: number;
}

interface WantListItem {
  id: string;
  card_id: string;
  cards: CardData;
  hasMatch: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = ["My Cards", "Sets", "Wishlist"] as const;
type Tab = typeof TABS[number];
type SortOption = "value-desc" | "value-asc" | "name-asc" | "name-desc" | "date-desc" | "number-asc";

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CollectionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("My Cards");
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [stats, setStats] = useState({ totalCards: 0, totalValue: 0, totalGraded: 0, totalForTrade: 0 });
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  // Add Card Modal
  const [addModalCard, setAddModalCard] = useState<{
    id: string; name: string; number: string; image_url: string | null;
    market_value: number | null; set_name: string;
  } | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch("/api/collection");
      const data = await res.json();
      if (data.collections) setCollections(data.collections);
      if (data.stats) setStats({
        totalCards: data.stats.totalCards || 0,
        totalValue: data.stats.totalValue || 0,
        totalGraded: data.stats.totalGraded || 0,
        totalForTrade: data.stats.totalForTrade || 0,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCollection(); }, [fetchCollection]);

  const handleAddViaModal = async (data: {
    card_id: string; variant: string; condition: string;
    is_graded: boolean; grading_company: string | null;
    grade: number | null; purchase_price: number | null; quantity: number;
  }) => {
    let collectionId = collections[0]?.id;
    if (!collectionId) {
      const createRes = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_collection", name: "My Collection" }),
      });
      const created = await createRes.json();
      collectionId = created.collection?.id;
    }
    if (!collectionId) return;

    await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_item",
        collection_id: collectionId,
        card_id: data.card_id,
        condition: data.condition,
        quantity: data.quantity,
        is_graded: data.is_graded,
        grading_company: data.grading_company,
        grade: data.grade,
        purchase_price: data.purchase_price,
      }),
    });
    fetchCollection();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collection</h1>
          <p className="text-gray-500 text-sm mt-1">Track, manage, and grow your card collection</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowScanner(true)} variant="outline" size="sm" className="gap-2">
            <Camera className="h-4 w-4" /> Scan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "My Cards" && (
        <MyCardsTab
          collections={collections}
          stats={stats}
          loading={loading}
          onRemoveItem={async (itemId) => {
            await fetch("/api/collection", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "remove_item", item_id: itemId }),
            });
            fetchCollection();
          }}
          onOpenScanner={() => setShowScanner(true)}
        />
      )}
      {activeTab === "Sets" && (
        <SetsTab
          collections={collections}
          onAddCard={(card) => setAddModalCard(card)}
        />
      )}
      {activeTab === "Wishlist" && (
        <WishlistTab
          onAddCard={(card) => setAddModalCard(card)}
        />
      )}

      {/* Card Scanner */}
      <CardScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onAddCard={async (cardId, condition, quantity) => {
          let collectionId = collections[0]?.id;
          if (!collectionId) {
            const createRes = await fetch("/api/collection", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "create_collection", name: "My Collection" }),
            });
            const created = await createRes.json();
            collectionId = created.collection?.id;
          }
          if (collectionId) {
            await fetch("/api/collection", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "add_item", collection_id: collectionId, card_id: cardId, condition, quantity }),
            });
          }
          fetchCollection();
        }}
      />

      {/* Enhanced Add Card Modal */}
      <AddCardModal
        card={addModalCard}
        open={!!addModalCard}
        onClose={() => setAddModalCard(null)}
        onAdd={handleAddViaModal}
      />
    </div>
  );
}

// ─── My Cards Tab ────────────────────────────────────────────────────────────

function MyCardsTab({
  collections, stats, loading, onRemoveItem, onOpenScanner,
}: {
  collections: CollectionData[];
  stats: { totalCards: number; totalValue: number; totalGraded: number; totalForTrade: number };
  loading: boolean;
  onRemoveItem: (id: string) => Promise<void>;
  onOpenScanner: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [filterSet, setFilterSet] = useState("");
  const [filterGraded, setFilterGraded] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 40;

  const allItems = collections.flatMap((c) => c.collection_items || []);

  // Filter
  let filtered = allItems;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((i) =>
      i.cards?.name?.toLowerCase().includes(q) ||
      i.cards?.number?.toLowerCase().includes(q)
    );
  }
  if (filterCondition) filtered = filtered.filter((i) => i.condition === filterCondition);
  if (filterRarity) filtered = filtered.filter((i) => i.cards?.rarity === filterRarity);
  if (filterSet) filtered = filtered.filter((i) => i.cards?.card_sets?.name === filterSet);
  if (filterGraded === "graded") filtered = filtered.filter((i) => i.is_graded);
  if (filterGraded === "raw") filtered = filtered.filter((i) => !i.is_graded);

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "value-desc": return (b.current_value || b.cards?.market_value || 0) - (a.current_value || a.cards?.market_value || 0);
      case "value-asc": return (a.current_value || a.cards?.market_value || 0) - (b.current_value || b.cards?.market_value || 0);
      case "name-asc": return (a.cards?.name || "").localeCompare(b.cards?.name || "");
      case "name-desc": return (b.cards?.name || "").localeCompare(a.cards?.name || "");
      case "number-asc": return (a.cards?.number || "").localeCompare(b.cards?.number || "", undefined, { numeric: true });
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const availableSets = [...new Set(allItems.map((i) => i.cards?.card_sets?.name).filter(Boolean))].sort() as string[];
  const availableRarities = [...new Set(allItems.map((i) => i.cards?.rarity).filter(Boolean))].sort() as string[];

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Cards", value: stats.totalCards.toLocaleString(), color: "text-blue-600" },
          { label: "Total Value", value: `$${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-green-600" },
          { label: "Graded", value: stats.totalGraded.toLocaleString(), color: "text-purple-600" },
          { label: "For Trade", value: stats.totalForTrade.toLocaleString(), color: "text-orange-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-3 pb-2.5 text-center">
              {loading ? <Skeleton className="h-6 w-16 mx-auto" /> : (
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              )}
              <div className="text-[11px] text-gray-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search cards..."
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Filters
        </Button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
        >
          <option value="date-desc">Newest</option>
          <option value="value-desc">Value ↓</option>
          <option value="value-asc">Value ↑</option>
          <option value="name-asc">Name A–Z</option>
          <option value="number-asc">Set #</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} cards</span>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Condition</label>
                <select value={filterCondition} onChange={(e) => { setFilterCondition(e.target.value); setPage(1); }}
                  className="w-full h-8 rounded-md border border-gray-200 bg-white px-2 text-xs">
                  <option value="">All</option>
                  {CONDITION_LIST.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Rarity</label>
                <select value={filterRarity} onChange={(e) => { setFilterRarity(e.target.value); setPage(1); }}
                  className="w-full h-8 rounded-md border border-gray-200 bg-white px-2 text-xs">
                  <option value="">All</option>
                  {availableRarities.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Set</label>
                <select value={filterSet} onChange={(e) => { setFilterSet(e.target.value); setPage(1); }}
                  className="w-full h-8 rounded-md border border-gray-200 bg-white px-2 text-xs">
                  <option value="">All</option>
                  {availableSets.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Graded</label>
                <select value={filterGraded} onChange={(e) => { setFilterGraded(e.target.value); setPage(1); }}
                  className="w-full h-8 rounded-md border border-gray-200 bg-white px-2 text-xs">
                  <option value="">All</option>
                  <option value="graded">Graded Only</option>
                  <option value="raw">Raw Only</option>
                </select>
              </div>
            </div>
            {(filterCondition || filterRarity || filterSet || filterGraded) && (
              <Button variant="ghost" size="sm" className="mt-2 text-xs"
                onClick={() => { setFilterCondition(""); setFilterRarity(""); setFilterSet(""); setFilterGraded(""); setPage(1); }}>
                Clear All
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}><CardContent className="p-3">
              <Skeleton className="aspect-[2.5/3.5] w-full rounded-md mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent></Card>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-12 w-12 text-gray-200 mb-4" />
            <h3 className="font-semibold mb-1">
              {allItems.length === 0 ? "No cards yet" : "No cards match filters"}
            </h3>
            <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
              {allItems.length === 0 ? "Scan or search to add your first card!" : "Try adjusting your filters."}
            </p>
            {allItems.length === 0 && (
              <Button size="sm" onClick={onOpenScanner} className="gap-2">
                <Camera className="h-4 w-4" /> Scan First Card
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {paginated.map((item) => {
            const isReserved = !!item.reserved_for_trade_id;
            const ci = getConditionInfo(item.condition);
            return (
              <Card key={item.id} className={`group relative overflow-hidden ${isReserved ? "ring-1 ring-red-300 bg-red-50/30" : ""}`}>
                <CardContent className="p-2.5">
                  {item.cards?.image_url ? (
                    <div className="aspect-[2.5/3.5] relative mb-2 rounded-md overflow-hidden bg-gray-50">
                      <Image src={item.cards.image_url} alt={item.cards.name} fill
                        className="object-contain" sizes="(max-width: 640px) 50vw, 20vw" />
                      {isReserved && (
                        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center">
                            <Lock className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[2.5/3.5] bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <h3 className="font-medium text-xs truncate">{item.cards?.name || "Unknown"}</h3>
                  <p className="text-[11px] text-gray-500 truncate">
                    {item.cards?.card_sets?.name} · #{item.cards?.number}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ci.color} ${ci.borderColor}`}>
                      {ci.shortLabel}
                    </Badge>
                    <span className="text-xs font-semibold">
                      ${(item.current_value || item.cards?.market_value || 0).toFixed(2)}
                    </span>
                  </div>
                  {item.is_graded && item.grading_company && (
                    <Badge className="text-[10px] mt-1 bg-purple-100 text-purple-700 border-purple-200">
                      {item.grading_company} {item.grade}
                    </Badge>
                  )}
                  {item.quantity > 1 && (
                    <Badge className="text-[10px] mt-1">×{item.quantity}</Badge>
                  )}

                  {/* Hover Actions */}
                  {!isReserved && (
                    <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onRemoveItem(item.id)} title="Remove"
                        className="h-6 w-6 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Sets Tab ────────────────────────────────────────────────────────────────

function SetsTab({
  collections,
  onAddCard,
}: {
  collections: CollectionData[];
  onAddCard: (card: { id: string; name: string; number: string; image_url: string | null; market_value: number | null; set_name: string }) => void;
}) {
  const [sets, setSets] = useState<SetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSet, setSelectedSet] = useState<SetData | null>(null);
  const [setCards, setSetCards] = useState<CardData[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [setFilter, setSetFilter] = useState<"all" | "collected" | "missing">("all");

  useEffect(() => {
    fetch("/api/collection/sets")
      .then((r) => r.json())
      .then((d) => setSets(d.sets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Get collected card IDs from collections
  const collectedCardIds = new Set(
    collections.flatMap((c) => (c.collection_items || []).map((i) => i.card_id))
  );

  const handleSelectSet = async (set: SetData) => {
    setSelectedSet(set);
    setLoadingCards(true);
    setSetFilter("all");
    try {
      const res = await fetch(`/api/cards/search?set=${set.id}&limit=500`);
      const data = await res.json();
      setSetCards(data.cards || []);
    } catch {
    } finally {
      setLoadingCards(false);
    }
  };

  const handleAddToWishlist = async (cardId: string) => {
    try {
      await fetch("/api/want-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", card_id: cardId }),
      });
    } catch {}
  };

  // Filter sets by search
  const filteredSets = sets.filter((s) =>
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.series?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If a set is selected, show the set detail view
  if (selectedSet) {
    let displayCards = setCards;
    if (setFilter === "collected") displayCards = setCards.filter((c) => collectedCardIds.has(c.id));
    if (setFilter === "missing") displayCards = setCards.filter((c) => !collectedCardIds.has(c.id));

    return (
      <div className="space-y-4">
        {/* Back + Set Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSet(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-bold">{selectedSet.name}</h2>
            <p className="text-xs text-gray-500">{selectedSet.series} · {selectedSet.collected_count}/{selectedSet.total_cards} collected</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all"
            style={{ width: `${selectedSet.total_cards ? (selectedSet.collected_count / selectedSet.total_cards) * 100 : 0}%` }}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {(["all", "collected", "missing"] as const).map((f) => (
            <button key={f} onClick={() => setSetFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                setFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {f === "all" ? `All (${setCards.length})` :
               f === "collected" ? `Collected (${setCards.filter((c) => collectedCardIds.has(c.id)).length})` :
               `Missing (${setCards.filter((c) => !collectedCardIds.has(c.id)).length})`}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {loadingCards ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}><Skeleton className="aspect-[2.5/3.5] w-full rounded-lg" /></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {displayCards.map((card) => {
              const isCollected = collectedCardIds.has(card.id);
              return (
                <div key={card.id} className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
                  isCollected ? "border-green-400 bg-white" : "border-gray-200 bg-gray-50 opacity-60"
                }`}>
                  {card.image_url ? (
                    <div className="aspect-[2.5/3.5] relative">
                      <Image src={card.image_url} alt={card.name} fill
                        className="object-contain" sizes="(max-width: 640px) 33vw, 16vw" />
                    </div>
                  ) : (
                    <div className="aspect-[2.5/3.5] flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                  <div className="p-1.5">
                    <p className="text-[11px] font-medium truncate">{card.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">#{card.number}</span>
                      {card.market_value != null && (
                        <span className="text-[10px] font-medium">${card.market_value.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!isCollected && (
                      <button
                        onClick={() => onAddCard({
                          id: card.id, name: card.name, number: card.number,
                          image_url: card.image_url, market_value: card.market_value,
                          set_name: selectedSet.name,
                        })}
                        className="bg-green-500 text-white text-xs px-2.5 py-1.5 rounded-full font-medium hover:bg-green-600"
                      >
                        + Collect
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToWishlist(card.id)}
                      className="bg-white/90 text-yellow-600 p-1.5 rounded-full hover:bg-white"
                      title="Add to Wishlist"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {isCollected && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Sets grid
  return (
    <div className="space-y-4">
      {/* Search Sets */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sets..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-3" />
              <Skeleton className="h-4 w-3/4 mx-auto mb-1" />
              <Skeleton className="h-3 w-1/2 mx-auto" />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredSets.map((set) => {
            const progress = set.total_cards ? (set.collected_count / set.total_cards) * 100 : 0;
            return (
              <Card key={set.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectSet(set)}>
                <CardContent className="p-4 text-center">
                  {/* Circular Progress Ring */}
                  <div className="relative w-16 h-16 mx-auto mb-3">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#22c55e" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${progress * 1.76} ${176 - progress * 1.76}`} />
                    </svg>
                    {set.symbol_url ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image src={set.symbol_url} alt="" width={24} height={24} className="object-contain" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">{Math.round(progress)}%</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate">{set.name}</h3>
                  <p className="text-[11px] text-gray-500 truncate">{set.series}</p>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    {set.collected_count}/{set.total_cards} collected
                  </p>
                  {set.collected_value > 0 && (
                    <p className="text-[11px] text-green-600 font-medium">
                      ${set.collected_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Wishlist Tab ────────────────────────────────────────────────────────────

function WishlistTab({
  onAddCard,
}: {
  onAddCard: (card: { id: string; name: string; number: string; image_url: string | null; market_value: number | null; set_name: string }) => void;
}) {
  const [items, setItems] = useState<WantListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/want-list");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleRemove = async (itemId: string) => {
    await fetch("/api/want-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", item_id: itemId }),
    });
    fetchWishlist();
  };

  const totalValue = items.reduce((sum, i) => sum + (i.cards?.market_value || 0), 0);

  return (
    <div className="space-y-4">
      {/* Wishlist Stats */}
      <Card>
        <CardContent className="py-3 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Wishlist Value</span>
            <p className="text-xl font-bold text-blue-600">
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Badge variant="outline">{items.length} cards</Badge>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-3">
              <Skeleton className="aspect-[2.5/3.5] w-full rounded-md mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-12 w-12 text-gray-200 mb-4" />
            <h3 className="font-semibold mb-1">Wishlist is empty</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Browse sets and tap the star to add cards to your wishlist.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden">
              <CardContent className="p-2.5">
                {item.cards?.image_url ? (
                  <div className="aspect-[2.5/3.5] relative mb-2 rounded-md overflow-hidden bg-gray-50">
                    <Image src={item.cards.image_url} alt={item.cards.name} fill
                      className="object-contain" sizes="(max-width: 640px) 50vw, 20vw" />
                  </div>
                ) : (
                  <div className="aspect-[2.5/3.5] bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                <h3 className="font-medium text-xs truncate">{item.cards?.name}</h3>
                <p className="text-[11px] text-gray-500 truncate">
                  {item.cards?.card_sets?.name} · #{item.cards?.number}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs font-semibold">
                    ${(item.cards?.market_value || 0).toFixed(2)}
                  </span>
                  {item.hasMatch && (
                    <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Available</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 mt-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] gap-1"
                    onClick={() => onAddCard({
                      id: item.cards.id, name: item.cards.name, number: item.cards.number,
                      image_url: item.cards.image_url, market_value: item.cards.market_value,
                      set_name: item.cards.card_sets?.name || "",
                    })}>
                    <Plus className="h-3 w-3" /> Collect
                  </Button>
                  <button onClick={() => handleRemove(item.id)} title="Remove"
                    className="h-7 w-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
