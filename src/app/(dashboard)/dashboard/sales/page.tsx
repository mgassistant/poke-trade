"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Plus, DollarSign, Package, TrendingUp, Loader2, X, Search,
  Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface CardData {
  id: string;
  name: string;
  number: string;
  rarity: string;
  image_url: string | null;
  market_value: number | null;
  card_sets: { name: string; symbol_url?: string } | null;
}

interface ListingUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  trade_score: number;
}

interface Listing {
  id: string;
  user_id: string;
  card_id: string;
  title: string;
  description: string | null;
  condition: string;
  price: number;
  shipping_cost: number;
  accepts_offers: boolean;
  photos: string[];
  status: string;
  created_at: string;
  updated_at: string;
  card: CardData | null;
  user: ListingUser | null;
}

interface CollectionCard {
  id: string;
  card_id: string;
  cards: {
    id: string;
    name: string;
    number: string;
    rarity: string;
    image_url: string | null;
    market_value: number | null;
    card_sets: { name: string } | null;
  };
}

type Tab = "active" | "sold" | "cancelled";

const CONDITIONS = [
  { value: "mint", label: "Mint" },
  { value: "near_mint", label: "Near Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "played", label: "Played" },
  { value: "poor", label: "Poor" },
];

const CONDITION_LABELS: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  played: "Played",
  poor: "Poor",
};

export default function SalesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  // Stats
  const [stats, setStats] = useState({ totalSold: 0, totalRevenue: 0, activeCount: 0 });

  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch("/api/listings?mine=true&limit=50");
      const data = await res.json();
      if (data.listings) {
        setListings(data.listings);
        const sold = data.listings.filter((l: Listing) => l.status === "sold");
        const active = data.listings.filter((l: Listing) => l.status === "active");
        setStats({
          totalSold: sold.length,
          totalRevenue: sold.reduce((sum: number, l: Listing) => sum + Number(l.price), 0),
          activeCount: active.length,
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filtered = listings.filter((l) => {
    if (tab === "active") return l.status === "active";
    if (tab === "sold") return l.status === "sold";
    return l.status === "cancelled" || l.status === "expired";
  });

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    await fetchListings();
  };

  const handleReactivate = async (id: string) => {
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    await fetchListings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    await fetchListings();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Sales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your listings and track sales
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Listing
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Items Sold</p>
              <p className="text-lg font-bold">{stats.totalSold}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Listings</p>
              <p className="text-lg font-bold">{stats.activeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        {([
          { key: "active" as Tab, label: "Active", count: listings.filter(l => l.status === "active").length },
          { key: "sold" as Tab, label: "Sold", count: listings.filter(l => l.status === "sold").length },
          { key: "cancelled" as Tab, label: "Cancelled", count: listings.filter(l => l.status === "cancelled" || l.status === "expired").length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-[2.5/3.5] w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No {tab} listings</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              {tab === "active"
                ? "Create your first listing to start selling!"
                : `You don't have any ${tab} listings.`}
            </p>
            {tab === "active" && (
              <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create Listing
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Card Image */}
                <div className="aspect-[2.5/3.5] relative bg-muted">
                  {listing.card?.image_url ? (
                    <Image
                      src={listing.card.image_url}
                      alt={listing.title}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className={`text-[10px] ${
                      listing.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : listing.status === "sold"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                    }`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{listing.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-green-400">${Number(listing.price).toFixed(2)}</span>
                    {listing.shipping_cost > 0 && (
                      <span className="text-xs text-muted-foreground">+${Number(listing.shipping_cost).toFixed(2)} ship</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {CONDITION_LABELS[listing.condition] || listing.condition}
                    </Badge>
                    {listing.accepts_offers && (
                      <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        Accepts Offers
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Listed {new Date(listing.created_at).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  {listing.status === "active" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 h-8 text-xs"
                        onClick={() => setEditingListing(listing)}
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 text-xs"
                        onClick={() => handleDeactivate(listing.id)}
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 text-xs text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {(listing.status === "cancelled" || listing.status === "expired") && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 h-8 text-xs"
                        onClick={() => handleReactivate(listing.id)}
                      >
                        <Eye className="h-3 w-3" /> Reactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 text-xs text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <CreateListingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchListings(); }}
        />
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onUpdated={() => { setEditingListing(null); fetchListings(); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   CREATE LISTING MODAL
   ============================================================ */
function CreateListingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<"select" | "details">("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("near_mint");
  const [price, setPrice] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [acceptsOffers, setAcceptsOffers] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/collection");
        const data = await res.json();
        // Flatten collection_items from all collections
        const allItems: CollectionCard[] = [];
        if (data.collections) {
          for (const col of data.collections) {
            if (col.collection_items) {
              for (const item of col.collection_items) {
                if (item.cards) {
                  allItems.push({
                    id: item.id,
                    card_id: item.card_id,
                    cards: item.cards,
                  });
                }
              }
            }
          }
        }
        setCollectionCards(allItems);
      } catch {
      } finally {
        setLoadingCards(false);
      }
    })();
  }, []);

  const filteredCards = collectionCards.filter((c) =>
    c.cards?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCard = (card: CollectionCard) => {
    setSelectedCard(card);
    setTitle(card.cards.name);
    setPrice(card.cards.market_value ? card.cards.market_value.toFixed(2) : "");
    setStep("details");
  };

  const handleCreate = async () => {
    if (!selectedCard || !title || !price) return;
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: selectedCard.card_id,
          title,
          description: description || null,
          condition,
          price: parseFloat(price),
          shipping_cost: parseFloat(shippingCost) || 0,
          accepts_offers: acceptsOffers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create listing");
        return;
      }
      onCreated();
    } catch {
      setError("Failed to create listing");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {step === "details" && (
              <button onClick={() => setStep("select")} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === "select" ? "Select Card from Collection" : "Listing Details"}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "select" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingCards ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Skeleton key={i} className="aspect-[2.5/3.5] rounded-lg" />
                  ))}
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "No matching cards found" : "No cards in your collection"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filteredCards.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectCard(item)}
                      className="group text-left"
                    >
                      <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden bg-muted relative ring-2 ring-transparent group-hover:ring-primary transition-all">
                        {item.cards?.image_url ? (
                          <Image
                            src={item.cards.image_url}
                            alt={item.cards.name}
                            fill
                            className="object-contain"
                            sizes="120px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] truncate mt-1">{item.cards?.name}</p>
                      {item.cards?.market_value && (
                        <p className="text-[10px] text-green-400">${item.cards.market_value.toFixed(2)}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Card Preview */}
              {selectedCard && (
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="h-20 w-14 rounded overflow-hidden bg-muted relative shrink-0">
                    {selectedCard.cards?.image_url && (
                      <Image
                        src={selectedCard.cards.image_url}
                        alt={selectedCard.cards.name}
                        fill
                        className="object-contain"
                        sizes="56px"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedCard.cards?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCard.cards?.card_sets?.name} · #{selectedCard.cards?.number}
                    </p>
                    {selectedCard.cards?.market_value && (
                      <p className="text-xs text-green-400 mt-1">Market: ${selectedCard.cards.market_value.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Listing title"
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about the card condition, centering, etc."
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Condition</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCondition(c.value)}
                      className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                        condition === c.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Shipping */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Shipping ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Listing Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Listing Type</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setAcceptsOffers(false)}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                      !acceptsOffers
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Fixed Price
                  </button>
                  <button
                    onClick={() => setAcceptsOffers(true)}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                      acceptsOffers
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Best Offer
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "details" && (
          <div className="p-4 border-t border-border flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !title || !price}
              className="flex-1 gap-2"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Listing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   EDIT LISTING MODAL
   ============================================================ */
function EditListingModal({ listing, onClose, onUpdated }: { listing: Listing; onClose: () => void; onUpdated: () => void }) {
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description || "");
  const [condition, setCondition] = useState(listing.condition);
  const [price, setPrice] = useState(String(listing.price));
  const [shippingCost, setShippingCost] = useState(String(listing.shipping_cost));
  const [acceptsOffers, setAcceptsOffers] = useState(listing.accepts_offers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          condition,
          price: parseFloat(price),
          shipping_cost: parseFloat(shippingCost) || 0,
          accepts_offers: acceptsOffers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        return;
      }
      onUpdated();
    } catch {
      setError("Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Edit Listing</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Condition</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCondition(c.value)}
                  className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                    condition === c.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
              <Input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Shipping ($)</label>
              <Input type="number" step="0.01" min="0" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Listing Type</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setAcceptsOffers(false)}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  !acceptsOffers ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Fixed Price
              </button>
              <button
                onClick={() => setAcceptsOffers(true)}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  acceptsOffers ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Best Offer
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title || !price} className="flex-1 gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
