"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Store, Search, Users, Star, Filter, ChevronRight,
  Package, Loader2, ArrowUpDown, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface BoothCard {
  id: string;
  title: string;
  price: number;
  condition: string;
  card: {
    id: string;
    name: string;
    image_url: string | null;
    market_value: number | null;
    rarity: string;
    card_sets: { name: string; symbol_url?: string } | null;
  } | null;
}

interface Booth {
  seller: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    trade_score: number;
    trader_level: number;
    verification_level: string | null;
    subscription_tier: string | null;
    is_featured: boolean;
  };
  listings: BoothCard[];
  totalListings: number;
  isOnline: boolean;
  isAway: boolean;
}

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rated", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
];

const TRADER_LEVELS = ["Rookie", "Trainer", "Ace", "Elite", "Champion", "Master"];

function OnlineIndicator({ isOnline, isAway }: { isOnline: boolean; isAway: boolean }) {
  if (isOnline) return <span className="h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white inline-block" title="Online" />;
  if (isAway) return <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-white inline-block" title="Away" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-gray-300 ring-2 ring-white inline-block" title="Offline" />;
}

function PriceBadge({ price, marketValue }: { price: number; marketValue: number | null }) {
  if (!marketValue || marketValue <= 0) return null;
  const ratio = price / marketValue;
  if (ratio <= 1) return <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px]">✓ Fair Price</Badge>;
  if (ratio <= 1.5) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[9px]">Premium</Badge>;
  return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[9px]">High</Badge>;
}

export default function TradeFloorPage() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [featured, setFeatured] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("popular");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBooth, setExpandedBooth] = useState<string | null>(null);
  const [activeTraders, setActiveTraders] = useState(0);

  const fetchBooths = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (search) params.set("search", search);
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);

      const res = await fetch(`/api/trade-floor?${params}`);
      const data = await res.json();
      setBooths(data.booths || []);
      setFeatured(data.featured || []);
      setActiveTraders(data.activeTraders || 0);
    } catch {} finally {
      setLoading(false);
    }
  }, [sort, search, minPrice, maxPrice]);

  useEffect(() => { fetchBooths(); }, [fetchBooths]);

  // Update online status
  useEffect(() => {
    fetch("/api/users/status", { method: "POST" });
    const interval = setInterval(() => {
      fetch("/api/users/status", { method: "POST" });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🏪 Trade Floor
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse vendor booths and find your next trade
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{activeTraders} traders online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search booths..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); } }}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setSearch(searchInput)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-primary/10 text-primary" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sort By</label>
                <div className="flex gap-1.5 mt-1">
                  {SORT_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSort(s.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        sort === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Min Price</label>
                  <Input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="$0" className="mt-1 w-24" />
                </div>
                <span className="pb-2 text-muted-foreground">—</span>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Max Price</label>
                  <Input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="$999" className="mt-1 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Featured Booths */}
      {featured.length > 0 && (
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-yellow-500" /> Featured Booths
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map(booth => (
              <BoothCard key={booth.seller.id} booth={booth} expanded={expandedBooth === booth.seller.id} onToggle={() => setExpandedBooth(expandedBooth === booth.seller.id ? null : booth.seller.id)} isFeatured />
            ))}
          </div>
        </div>
      )}

      {/* All Booths */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Store className="h-5 w-5" /> All Booths
          <span className="text-sm font-normal text-muted-foreground">({booths.length} sellers)</span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1"><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-3 w-16" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(j => <Skeleton key={j} className="aspect-[2.5/3.5] rounded-md" />)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : booths.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Store className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="font-semibold mb-1">No booths found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {booths.map(booth => (
              <BoothCard key={booth.seller.id} booth={booth} expanded={expandedBooth === booth.seller.id} onToggle={() => setExpandedBooth(expandedBooth === booth.seller.id ? null : booth.seller.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoothCard({ booth, expanded, onToggle, isFeatured }: { booth: Booth; expanded: boolean; onToggle: () => void; isFeatured?: boolean }) {
  const { seller, listings, totalListings, isOnline, isAway } = booth;
  const displayCards = expanded ? listings : listings.slice(0, 3);

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${isFeatured ? "ring-2 ring-yellow-400/50 bg-yellow-50/30" : ""}`}>
      <CardContent className="p-0">
        {/* Booth Header */}
        <div className={`p-4 ${isFeatured ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200" : "border-b border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {seller.avatar_url ? (
                  <Image src={seller.avatar_url} alt="" width={40} height={40} className="object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-500">{(seller.display_name || seller.username)[0].toUpperCase()}</span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                <OnlineIndicator isOnline={isOnline} isAway={isAway} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{seller.display_name || seller.username}</p>
                {isFeatured && <Sparkles className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  {Number(seller.trade_score).toFixed(1)}
                </span>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {TRADER_LEVELS[Math.min(seller.trader_level || 0, 5)]}
                </Badge>
                {isOnline && (
                  <span className="text-[10px] text-green-600 font-medium">Available to Trade</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">{totalListings} cards</p>
            </div>
          </div>
        </div>

        {/* Cards Preview */}
        <div className="p-3">
          <div className={`grid gap-2 ${expanded ? "grid-cols-3 sm:grid-cols-3" : "grid-cols-3"}`}>
            {displayCards.map(item => (
              <div key={item.id} className="relative group">
                <div className="aspect-[2.5/3.5] rounded-md overflow-hidden bg-gray-50 border border-gray-100 relative">
                  {item.card?.image_url ? (
                    <Image src={item.card.image_url} alt={item.title} fill className="object-contain p-0.5" sizes="100px" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-[10px] truncate font-medium">{item.card?.name || item.title}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-green-600">${Number(item.price).toFixed(2)}</span>
                    <PriceBadge price={Number(item.price)} marketValue={item.card?.market_value || null} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {totalListings > 3 && (
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={onToggle}>
                {expanded ? "Show Less" : `View All ${totalListings} Cards`}
                <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </Button>
            )}
            {isOnline && (
              <Link href={`/dashboard/trades/new`}>
                <Button size="sm" className="text-xs h-8 bg-[#E3350D] hover:bg-[#c72e0b]">
                  Propose Trade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
