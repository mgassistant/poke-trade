"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  ShoppingBag, Search, Filter, ChevronLeft, ChevronRight, Loader2, X,
  Package, Tag, Star, ShieldCheck, Shield, Flag, AlertTriangle
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

interface SellerInfo {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  trade_score: number;
  trader_level: number;
  verification_level: string | null;
}

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  condition: string;
  price: number;
  shipping_cost: number;
  accepts_offers: boolean;
  photos: string[];
  status: string;
  created_at: string;
  card: CardData | null;
  user: SellerInfo | null;
}

const CONDITIONS = [
  { value: "", label: "All" },
  { value: "gem_mint", label: "Gem Mint" },
  { value: "mint", label: "Mint" },
  { value: "near_mint", label: "NM" },
  { value: "lightly_played", label: "LP" },
  { value: "moderately_played", label: "MP" },
  { value: "heavily_played", label: "HP" },
  { value: "damaged", label: "DMG" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Newest" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
];

const CONDITION_LABELS: Record<string, string> = {
  gem_mint: "GM",
  mint: "M",
  near_mint: "NM",
  lightly_played: "LP",
  moderately_played: "MP",
  heavily_played: "HP",
  damaged: "DMG",
  // Legacy fallbacks
  excellent: "NM",
  good: "LP",
  played: "MP",
  poor: "DMG",
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("created_at");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [offerListing, setOfferListing] = useState<Listing | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.profile?.id) setCurrentUserId(data.profile.id);
      } catch {}
    })();
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "40",
        sort,
      });
      if (search) params.set("search", search);
      if (condition) params.set("condition", condition);
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);

      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      if (data.listings) {
        // Filter out own listings client-side
        const filtered = currentUserId
          ? data.listings.filter((l: Listing) => l.user_id !== currentUserId)
          : data.listings;
        setListings(filtered);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, condition, sort, minPrice, maxPrice, currentUserId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleBuyNow = async (listing: Listing) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse {total > 0 ? `${total} listings` : "cards"} for sale
          </p>
        </div>
      </div>

      {/* Price Protection Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <Shield className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-800">Price Protection Active</p>
          <p className="text-xs text-green-600">All listings capped at 2x market value — no scalping allowed</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 ${showFilters ? "bg-primary/10 text-primary" : ""}`}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Condition */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Condition</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setCondition(c.value); setPage(1); }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
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

              {/* Price Range */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Min Price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    placeholder="$0"
                    className="mt-1"
                  />
                </div>
                <span className="text-muted-foreground pb-2">—</span>
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Max Price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    placeholder="$999"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sort By</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { setSort(s.value); setPage(1); }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        sort === s.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {(condition || minPrice || maxPrice || search) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCondition("");
                    setMinPrice("");
                    setMaxPrice("");
                    setSearch("");
                    setSearchInput("");
                    setPage(1);
                  }}
                  className="text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="aspect-[2.5/3.5] w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No listings found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              {search ? `No results for "${search}"` : "No active listings available right now."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:ring-1 hover:ring-primary/30 transition-all">
                <CardContent className="p-0">
                  {/* Card Image */}
                  <div className="aspect-[2.5/3.5] relative bg-muted">
                    {listing.card?.image_url ? (
                      <Image
                        src={listing.card.image_url}
                        alt={listing.title}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Condition Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur-sm">
                        {CONDITION_LABELS[listing.condition] || listing.condition}
                      </Badge>
                    </div>
                    {listing.accepts_offers && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30 backdrop-blur-sm">
                          Best Offer
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{listing.title}</h3>
                    {listing.card?.card_sets?.name && (
                      <p className="text-[11px] text-muted-foreground truncate">{listing.card.card_sets.name}</p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-lg font-bold text-green-400">${Number(listing.price).toFixed(2)}</span>
                      {listing.shipping_cost > 0 && (
                        <span className="text-[10px] text-muted-foreground">+${Number(listing.shipping_cost).toFixed(2)} ship</span>
                      )}
                    </div>

                    {/* Market value comparison + Price Protection */}
                    {listing.card?.market_value && listing.card.market_value > 0 && (() => {
                      const ratio = Number(listing.price) / listing.card.market_value;
                      return (
                        <div className="mt-0.5 space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">Market: ${listing.card.market_value.toFixed(2)}</p>
                          {ratio <= 1 ? (
                            <Badge className="text-[8px] h-4 bg-green-100 text-green-700 border-green-200">✓ Fair Price</Badge>
                          ) : ratio <= 1.5 ? (
                            <Badge className="text-[8px] h-4 bg-yellow-100 text-yellow-700 border-yellow-200">Premium · {ratio.toFixed(1)}x</Badge>
                          ) : (
                            <Badge className="text-[8px] h-4 bg-orange-100 text-orange-700 border-orange-200">⚠ Above Market · {ratio.toFixed(1)}x</Badge>
                          )}
                        </div>
                      );
                    })()}

                    {/* Seller */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {listing.user?.avatar_url ? (
                          <Image src={listing.user.avatar_url} alt="" width={20} height={20} className="object-cover" />
                        ) : (
                          <span className="text-[8px] font-bold text-muted-foreground">
                            {(listing.user?.display_name || listing.user?.username || "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {listing.user?.display_name || listing.user?.username}
                      </span>
                      {listing.user?.trade_score && listing.user.trade_score > 0 && (
                        <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-yellow-400" />
                          {Number(listing.user.trade_score).toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={() => handleBuyNow(listing)}
                        disabled={buyingId === listing.id}
                      >
                        {buyingId === listing.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Tag className="h-3 w-3" />
                        )}
                        Buy Now
                      </Button>
                      {listing.accepts_offers && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => setOfferListing(listing)}
                        >
                          Offer
                        </Button>
                      )}
                    </div>
                    {/* Report Price Gouging */}
                    {listing.card?.market_value && Number(listing.price) > listing.card.market_value * 1.5 && (
                      <button
                        onClick={async () => {
                          if (!confirm("Report this listing for price gouging?")) return;
                          await fetch("/api/reports", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ listing_id: listing.id, report_type: "price_gouging", reason: `Listed at $${Number(listing.price).toFixed(2)}, market value $${listing.card!.market_value!.toFixed(2)}` }),
                          });
                          alert("Report submitted. Thank you!");
                        }}
                        className="flex items-center gap-1 mt-1.5 text-[10px] text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        <Flag className="h-3 w-3" /> Report Price Gouging
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Make Offer Modal */}
      {offerListing && (
        <MakeOfferModal
          listing={offerListing}
          onClose={() => setOfferListing(null)}
          onSubmitted={() => { setOfferListing(null); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   MAKE OFFER MODAL
   ============================================================ */
function MakeOfferModal({ listing, onClose, onSubmitted }: {
  listing: Listing;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      onSubmitted();
    } catch {
      setError("Failed to submit offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Make an Offer</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Listing Preview */}
          <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-16 w-12 rounded overflow-hidden bg-muted relative shrink-0">
              {listing.card?.image_url && (
                <Image src={listing.card.image_url} alt="" fill className="object-contain" sizes="48px" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{listing.title}</p>
              <p className="text-lg font-bold text-green-400">${Number(listing.price).toFixed(2)}</p>
            </div>
          </div>

          {/* Offer Amount */}
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

          {/* Message */}
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
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
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
      </div>
    </div>
  );
}
