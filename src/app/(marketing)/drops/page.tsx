"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell, Zap, ExternalLink, Search, Filter,
  ChevronDown, Eye, Clock, ArrowUpDown,
  TrendingDown, TrendingUp, Package, ShoppingCart,
  Lock, Shield, CheckCircle2, Crown, Star,
} from "lucide-react";
import { CardShowcase } from "@/components/shared/CardShowcase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/* ────────── types ────────── */

interface DropProduct {
  id: string;
  retailer: string;
  product_name: string;
  product_url: string | null;
  image_url: string | null;
  retail_price: number | null;
  current_price: number | null;
  in_stock: boolean;
  last_in_stock_at: string | null;
  last_checked_at: string | null;
  category: string | null;
  set_name: string | null;
  release_date: string | null;
  created_at: string;
}

interface DropAlert {
  id: string;
  product_id: string;
  alert_type: string;
  title: string;
  message: string | null;
  previous_price: number | null;
  new_price: number | null;
  created_at: string;
  drop_products: {
    product_name: string;
    retailer: string;
    product_url: string | null;
    image_url: string | null;
    current_price: number | null;
    in_stock: boolean;
  } | null;
}

/* ────────── constants ────────── */

const RETAILERS: {
  key: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}[] = [
  { key: "pokemon_center", name: "Pokémon Center", icon: "🎯", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  { key: "target", name: "Target", icon: "🎯", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
  { key: "walmart", name: "Walmart", icon: "🏪", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  { key: "amazon", name: "Amazon", icon: "📦", color: "text-orange-500", bgColor: "bg-orange-50 border-orange-200" },
  { key: "gamestop", name: "GameStop", icon: "🎮", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  { key: "bestbuy", name: "Best Buy", icon: "💻", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  { key: "tcgplayer", name: "TCGPlayer", icon: "🃏", color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
  { key: "costco", name: "Costco", icon: "🏬", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
];

const CATEGORIES = [
  { key: "", label: "All Categories" },
  { key: "booster_pack", label: "Booster Packs" },
  { key: "etb", label: "Elite Trainer Boxes" },
  { key: "booster_box", label: "Booster Boxes" },
  { key: "collection_box", label: "Collection Boxes" },
  { key: "tin", label: "Tins" },
  { key: "special", label: "Special / Premium" },
];

const STOCK_FILTERS = [
  { key: "", label: "All Stock" },
  { key: "true", label: "In Stock Only" },
  { key: "false", label: "Out of Stock" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest First" },
  { key: "price-asc", label: "Price: Low → High" },
  { key: "price-desc", label: "Price: High → Low" },
  { key: "restocked", label: "Recently Restocked" },
];

const ALERT_ICONS: Record<string, string> = {
  restock: "🟢",
  price_drop: "💰",
  new_release: "🆕",
  low_stock: "⚠️",
};

const ALERT_COLORS: Record<string, string> = {
  restock: "border-l-green-500 bg-green-50/50",
  price_drop: "border-l-blue-500 bg-blue-50/50",
  new_release: "border-l-purple-500 bg-purple-50/50",
  low_stock: "border-l-yellow-500 bg-yellow-50/50",
};

const TIER_COMPARISON = [
  { feature: "Restock alerts", free: "Daily digest", pro: "Real-time", elite: "Priority (30s faster)" },
  { feature: "Price drop alerts", free: "Daily digest", pro: "Real-time", elite: "Priority (30s faster)" },
  { feature: "Retailers monitored", free: "8 retailers", pro: "8 retailers", elite: "8 retailers" },
  { feature: "Watchlist", free: "Up to 5", pro: "Unlimited", elite: "Unlimited" },
  { feature: "Alert history", free: "7 days", pro: "Unlimited", elite: "Unlimited" },
  { feature: "New release alerts", free: "✓", pro: "✓", elite: "✓ (early access)" },
  { feature: "Target price alerts", free: "—", pro: "✓", elite: "✓" },
  { feature: "Low stock warnings", free: "—", pro: "✓", elite: "✓" },
];

/* ────────── helpers ────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function retailerLabel(key: string): string {
  return RETAILERS.find((r) => r.key === key)?.name ?? key;
}

function retailerIcon(key: string): string {
  return RETAILERS.find((r) => r.key === key)?.icon ?? "🏪";
}

function retailerBadgeClass(key: string): string {
  return RETAILERS.find((r) => r.key === key)?.bgColor ?? "bg-gray-50 border-gray-200";
}

function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function stockBadge(inStock: boolean, className?: string) {
  if (inStock) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full ${className ?? ""}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        In Stock
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full ${className ?? ""}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Out of Stock
    </span>
  );
}

/* ────────── component ────────── */

export default function DropsPage() {
  const [products, setProducts] = useState<DropProduct[]>([]);
  const [alerts, setAlerts] = useState<DropAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Membership tier check (free/pro/elite)
  const [memberTier, setMemberTier] = useState<"free" | "pro" | "elite">("free");
  const [tierLoading, setTierLoading] = useState(true);
  const isPro = memberTier === "pro" || memberTier === "elite";
  const isElite = memberTier === "elite";

  // Filters
  const [retailerFilter, setRetailerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Watchlist tracking (local state)
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  // Check membership tier
  useEffect(() => {
    async function checkTier() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setMemberTier(data.user?.subscription_tier || "free");
        }
      } catch {
        // Not logged in
      } finally {
        setTierLoading(false);
      }
    }
    checkTier();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (retailerFilter) params.set("retailer", retailerFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (stockFilter) params.set("in_stock", stockFilter);
    if (searchQuery) params.set("q", searchQuery);
    params.set("sort", sortBy);
    params.set("page", page.toString());

    try {
      const res = await fetch(`/api/drops/products?${params}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        setTotalProducts(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [retailerFilter, categoryFilter, stockFilter, searchQuery, sortBy, page]);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch("/api/drops/alerts?limit=15");
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch {
      // ignore
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Load watchlist (only if Pro or Elite)
  useEffect(() => {
    if (!isPro) return;
    async function loadWatchlist() {
      try {
        const res = await fetch("/api/drops/watchlist");
        const data = await res.json();
        if (data.watchlist) {
          setWatchedIds(new Set(data.watchlist.map((w: { product_id: string }) => w.product_id)));
        }
      } catch {
        // Not logged in or error
      }
    }
    loadWatchlist();
  }, [isPro]);

  const toggleWatch = async (productId: string) => {
    if (!isPro) return;
    const isWatched = watchedIds.has(productId);
    const newSet = new Set(watchedIds);

    if (isWatched) {
      newSet.delete(productId);
      setWatchedIds(newSet);
      try {
        await fetch(`/api/drops/watchlist?product_id=${productId}`, { method: "DELETE" });
      } catch {
        newSet.add(productId);
        setWatchedIds(new Set(newSet));
      }
    } else {
      newSet.add(productId);
      setWatchedIds(newSet);
      try {
        const res = await fetch("/api/drops/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        if (!res.ok) {
          newSet.delete(productId);
          setWatchedIds(new Set(newSet));
        }
      } catch {
        newSet.delete(productId);
        setWatchedIds(new Set(newSet));
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const inStockCount = products.filter((p) => p.in_stock).length;

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="absolute top-4 right-8 opacity-10 pointer-events-none hidden lg:block">
          <CardShowcase variant="fan" count={3} offset={3} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-amber-100/80 text-amber-700 rounded-full text-sm font-medium border border-amber-200/60">
            <Zap className="h-4 w-4" />
            Drop Alerts
            {alerts.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-bold">
                {alerts.length}
              </span>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-gray-900">Never Miss a </span>
            <span className="text-amber-500">Restock</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Real-time stock monitoring across {RETAILERS.length} major retailers.
            {totalProducts > 0 && (
              <span className="font-medium text-gray-700"> Tracking {totalProducts} products.</span>
            )}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100/80 text-green-700 rounded-full text-sm font-medium border border-green-200/60">
            <CheckCircle2 className="h-4 w-4" />
            Included with every membership — no extra cost
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isPro ? (
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg" asChild>
                <Link href="/dashboard/drops">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Go to My Alerts
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg"
                  asChild
                >
                  <Link href="/register">
                    Sign Up Free Today
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-gray-300" asChild>
                  <Link href="#compare">Compare Membership Tiers</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Live Alerts Ticker ── */}
      {!alertsLoading && alerts.length > 0 && (
        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Live Alerts</h2>
              <span className="text-xs text-gray-400">Last 24 hours</span>
              {!isPro && (
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 ml-auto">
                  <Lock className="h-3 w-3 mr-1" />
                  Pro &amp; Elite Members
                </Badge>
              )}
            </div>

            {isPro ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {alerts.slice(0, 8).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-colors ${ALERT_COLORS[alert.alert_type] ?? "border-l-gray-300 bg-gray-50/50"}`}
                  >
                    <span className="text-lg shrink-0">{ALERT_ICONS[alert.alert_type] ?? "📢"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{timeAgo(alert.created_at)}</p>
                      {alert.drop_products?.product_url && (
                        <a
                          href={alert.drop_products.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Blurred preview for free users */
              <div className="relative">
                <div className="space-y-2 max-h-48 overflow-hidden filter blur-[6px] pointer-events-none select-none">
                  {alerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${ALERT_COLORS[alert.alert_type] ?? "border-l-gray-300 bg-gray-50/50"}`}
                    >
                      <span className="text-lg shrink-0">{ALERT_ICONS[alert.alert_type] ?? "📢"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                        <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                  <div className="text-center">
                    <Lock className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Upgrade to see real-time alerts</p>
                    <p className="text-xs text-gray-500 mt-1">Free members get a daily digest</p>
                    <Button
                      size="sm"
                      className="mt-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                      asChild
                    >
                      <Link href="/pricing">View Plans</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tier Comparison ── */}
      <section id="compare" className="py-12 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b border-amber-200/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-2">
            Drop Alerts by <span className="text-amber-500">Membership Tier</span>
          </h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            Every member gets drop alerts — upgrade for faster, real-time notifications
          </p>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 border-b border-gray-100">
              <div className="p-4" />
              <div className="p-4 text-center">
                <div className="text-sm font-semibold text-gray-900">Free</div>
                <div className="text-xs text-gray-500">$0/mo</div>
              </div>
              <div className="p-4 text-center bg-red-50/50 border-x border-red-100">
                <div className="text-sm font-semibold text-red-600 flex items-center justify-center gap-1">
                  <Star className="h-3.5 w-3.5" /> Pro
                </div>
                <div className="text-xs text-gray-500">$19.99/mo</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-semibold text-amber-600 flex items-center justify-center gap-1">
                  <Crown className="h-3.5 w-3.5" /> Elite
                </div>
                <div className="text-xs text-gray-500">$29.99/mo</div>
              </div>
            </div>
            {/* Rows */}
            {TIER_COMPARISON.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 ${i < TIER_COMPARISON.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="p-3 text-sm text-gray-700 font-medium">{row.feature}</div>
                <div className="p-3 text-center text-xs text-gray-500">{row.free}</div>
                <div className="p-3 text-center text-xs text-gray-700 font-medium bg-red-50/30 border-x border-red-50">{row.pro}</div>
                <div className="p-3 text-center text-xs text-gray-700 font-medium">{row.elite}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-8">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold" asChild>
              <Link href="/pricing">
                <Star className="h-4 w-4 mr-1.5" />
                Get Pro
              </Link>
            </Button>
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" asChild>
              <Link href="/pricing">
                <Crown className="h-4 w-4 mr-1.5" />
                Get Elite
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Retailer Grid ── */}
      <section className="py-10 bg-gray-50/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Monitored Retailers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {RETAILERS.map((r) => {
              const isActive = retailerFilter === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    setRetailerFilter(isActive ? "" : r.key);
                    setPage(1);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                    isActive
                      ? "border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-300"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <span className="text-2xl">{r.icon}</span>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{r.name}</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-gray-400">Live</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Filters + Product Grid ── */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
            <form onSubmit={handleSearch} className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-10"
              />
            </form>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="h-10 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={stockFilter}
                onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
                className="h-10 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                {STOCK_FILTERS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="h-10 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {(retailerFilter || categoryFilter || stockFilter || searchQuery) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRetailerFilter("");
                  setCategoryFilter("");
                  setStockFilter("");
                  setSearchQuery("");
                  setSearchInput("");
                  setPage(1);
                }}
                className="text-xs text-gray-500"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? "Loading..." : `${totalProducts} products found`}
              {retailerFilter && ` at ${retailerLabel(retailerFilter)}`}
            </p>
            {!loading && totalProducts > 0 && (
              <p className="text-sm text-gray-500">
                <span className="text-green-600 font-medium">{inStockCount} in stock</span>
                {" · "}
                <span className="text-red-500">{products.length - inStockCount} out</span>
              </p>
            )}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No products found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => {
                const isWatched = watchedIds.has(product.id);
                const onSale = product.retail_price && product.current_price && product.current_price < product.retail_price;
                const savings = onSale ? product.retail_price! - product.current_price! : 0;

                return (
                  <Card key={product.id} className="group hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                        <span className="text-4xl opacity-20">🃏</span>
                        <div className="absolute top-2 left-2">
                          {stockBadge(product.in_stock)}
                        </div>
                        {isPro ? (
                          <button
                            onClick={() => toggleWatch(product.id)}
                            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                              isWatched
                                ? "bg-amber-500 text-white shadow-md"
                                : "bg-white/80 text-gray-400 hover:text-amber-500 hover:bg-white shadow-sm"
                            }`}
                            title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                          >
                            <Bell className="h-3.5 w-3.5" fill={isWatched ? "currentColor" : "none"} />
                          </button>
                        ) : (
                          <Link
                            href="/pricing"
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 text-gray-300 hover:text-amber-500 hover:bg-white shadow-sm transition-all"
                            title="Upgrade to Pro for watchlist"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        {onSale && (
                          <div className="absolute bottom-2 left-2">
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                              <TrendingDown className="h-3 w-3" />
                              Save ${savings.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-2.5">
                        <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${retailerBadgeClass(product.retailer)}`}>
                          <span>{retailerIcon(product.retailer)}</span>
                          {retailerLabel(product.retailer)}
                        </div>

                        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                          {product.product_name}
                        </h3>

                        {(product.set_name || product.category) && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {product.set_name && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {product.set_name}
                              </span>
                            )}
                            {product.category && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {categoryLabel(product.category)}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${product.current_price?.toFixed(2) ?? "—"}
                          </span>
                          {onSale && (
                            <span className="text-xs text-gray-400 line-through">
                              ${product.retail_price?.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {product.in_stock && product.product_url ? (
                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold rounded-lg transition-colors"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Buy Now
                            </a>
                          ) : (
                            <div className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                              <Eye className="h-3.5 w-3.5" />
                              Unavailable
                            </div>
                          )}
                          {product.product_url && (
                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                              title="Open retailer page"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>

                        {product.last_checked_at && (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Checked {timeAgo(product.last_checked_at)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 bg-gray-50/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-10">
            How <span className="text-amber-500">Drop Alerts</span> Work
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🔍", title: "We Monitor 24/7", desc: "Bots check major retailers every 30–60 seconds for stock changes, price drops, and new listings." },
              { icon: "⚡", title: "Instant Detection", desc: "The moment stock appears, we detect it — usually within 30 seconds of going live." },
              { icon: "🔔", title: "Push Notification", desc: "Pro members get instant alerts. Elite members get priority — 30 seconds faster than everyone else." },
              { icon: "🛒", title: "One-Tap Buy", desc: "Direct links take you straight to the product page. Add to cart before it sells out." },
            ].map((step) => (
              <div key={step.title} className="text-center p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{step.icon}</div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop Refreshing. Start <span className="text-amber-500">Getting Alerts</span>.
          </h2>
          <p className="text-gray-500 mb-8">
            Join thousands of collectors who never miss a drop.
          </p>
          {isPro ? (
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg" asChild>
              <Link href="/dashboard/drops">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Go to My Alerts
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg" asChild>
                <Link href="/register">
                  Sign Up Today — It's Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Membership Plans</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
