"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell, BellOff, Trash2, ExternalLink, Zap,
  ShoppingCart, Clock, TrendingDown, Package,
  Settings, Eye, DollarSign, Lock, CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/hooks/useUser";

/* ────────── types ────────── */

interface WatchlistItem {
  id: string;
  user_id: string;
  product_id: string;
  notify_restock: boolean;
  notify_price_drop: boolean;
  target_price: number | null;
  created_at: string;
  drop_products: {
    id: string;
    retailer: string;
    product_name: string;
    product_url: string | null;
    retail_price: number | null;
    current_price: number | null;
    in_stock: boolean;
    last_checked_at: string | null;
    category: string | null;
    set_name: string | null;
  } | null;
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
  } | null;
}

/* ────────── helpers ────────── */

const RETAILER_NAMES: Record<string, string> = {
  pokemon_center: "Pokémon Center",
  target: "Target",
  walmart: "Walmart",
  amazon: "Amazon",
  gamestop: "GameStop",
  bestbuy: "Best Buy",
  tcgplayer: "TCGPlayer",
  costco: "Costco",
};

const ALERT_ICONS: Record<string, string> = {
  restock: "🟢",
  price_drop: "💰",
  new_release: "🆕",
  low_stock: "⚠️",
};

const DROP_ALERTS_FEATURES = [
  { text: "Add to watchlist across 8 retailers", icon: "👁️" },
  { text: "Instant restock alerts", icon: "🟢" },
  { text: "Price drop notifications", icon: "💰" },
  { text: "New release alerts", icon: "🆕" },
  { text: "Low stock warnings", icon: "⚠️" },
  { text: "Live alerts ticker", icon: "📡" },
  { text: "Alert history", icon: "📋" },
  { text: "Target price alerts", icon: "🎯" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ────────── component ────────── */

export default function DashboardDropsPage() {
  const { profile, loading: userLoading } = useUser();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<DropAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Check subscription
  useEffect(() => {
    async function checkSub() {
      try {
        const res = await fetch("/api/drops/subscribe");
        const data = await res.json();
        setIsSubscribed(data.active === true);
      } catch {
        // ignore
      } finally {
        setSubLoading(false);
      }
    }
    checkSub();
  }, []);

  // Check for success param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      setSuccessMsg("Drop Alerts activated! Welcome aboard ⚡");
      setIsSubscribed(true);
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/drops");
    }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    if (!isSubscribed) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/drops/watchlist");
      const data = await res.json();
      if (data.watchlist) setWatchlist(data.watchlist);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isSubscribed]);

  const fetchAlerts = useCallback(async () => {
    if (!isSubscribed) {
      setAlertsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/drops/alerts?limit=20");
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch {
      // ignore
    } finally {
      setAlertsLoading(false);
    }
  }, [isSubscribed]);

  useEffect(() => {
    if (!subLoading) {
      fetchWatchlist();
      fetchAlerts();
    }
  }, [subLoading, fetchWatchlist, fetchAlerts]);

  const removeFromWatchlist = async (productId: string) => {
    setRemoving((prev) => new Set([...prev, productId]));
    try {
      await fetch(`/api/drops/watchlist?product_id=${productId}`, { method: "DELETE" });
      setWatchlist((prev) => prev.filter((w) => w.product_id !== productId));
    } catch {
      // ignore
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/drops/subscribe", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const inStockCount = watchlist.filter((w) => w.drop_products?.in_stock).length;
  const totalWatched = watchlist.length;

  // ── Not subscribed: locked state ──
  if (!subLoading && !isSubscribed) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" />
              Drop Alerts
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your watchlist and personalized alerts
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/drops">
              <Eye className="h-4 w-4 mr-1.5" />
              Browse Products
            </Link>
          </Button>
        </div>

        {/* Locked CTA */}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/50">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-100 mb-6">
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Drop Alerts is a premium add-on
            </h2>
            <p className="text-gray-500 mb-2 text-lg">
              <span className="font-bold text-amber-600">$5.99/mo</span> — works with any membership tier
            </p>
            <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
              Get instant alerts when products restock, prices drop, or new releases go live across 8 major retailers.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-2xl mx-auto">
              {DROP_ALERTS_FEATURES.map((feature) => (
                <div
                  key={feature.text}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
                >
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-[11px] text-gray-600 font-medium text-center leading-tight">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/25 px-8"
              onClick={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {subscribing ? "Loading..." : "Subscribe — $5.99/mo"}
            </Button>
          </CardContent>
        </Card>

        {/* Blurred preview */}
        <div className="relative">
          <div className="filter blur-[6px] pointer-events-none select-none opacity-50">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {["Watching", "In Stock", "Price Drops", "Alerts Today"].map((label) => (
                <Card key={label}>
                  <CardContent className="pt-5 pb-4">
                    <div className="text-2xl font-bold">—</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">My Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <div className="h-12 w-12 rounded bg-gray-100" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-48 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow-sm border border-amber-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                Subscribe to unlock your watchlist and alerts
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Subscribed: full functionality ──
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            Drop Alerts
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">PRO</Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your watchlist and personalized alerts
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/drops">
            <Eye className="h-4 w-4 mr-1.5" />
            Browse All Products
          </Link>
        </Button>
      </div>

      {/* Success message */}
      {successMsg && (
        <Card>
          <CardContent className="p-4 bg-green-50 border-green-200">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {successMsg}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Watching", value: totalWatched.toString(), icon: Bell, color: "text-amber-500" },
          { label: "In Stock", value: inStockCount.toString(), icon: Package, color: "text-green-500" },
          { label: "Price Drops", value: alerts.filter((a) => a.alert_type === "price_drop").length.toString(), icon: TrendingDown, color: "text-blue-500" },
          { label: "Alerts Today", value: alerts.length.toString(), icon: Zap, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">My Watchlist</CardTitle>
              {totalWatched > 0 && (
                <Badge variant="outline" className="text-xs">
                  {totalWatched} item{totalWatched !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : watchlist.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-700 mb-1">No items in watchlist</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Browse products and click the bell icon to start watching.
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/drops">Browse Products</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlist.map((item) => {
                    const product = item.drop_products;
                    if (!product) return null;
                    const isRemoving = removing.has(item.product_id);

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition-colors ${isRemoving ? "opacity-50" : ""}`}
                      >
                        {/* Product image placeholder */}
                        <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="text-xl">🃏</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {product.product_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {RETAILER_NAMES[product.retailer] ?? product.retailer}
                            </span>
                            {product.set_name && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-xs text-gray-400">{product.set_name}</span>
                              </>
                            )}
                          </div>
                          {/* Alert preferences */}
                          <div className="flex items-center gap-2 mt-1">
                            {item.notify_restock && (
                              <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                                Restock
                              </span>
                            )}
                            {item.notify_price_drop && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                                Price Drop
                              </span>
                            )}
                            {item.target_price && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                                Target: ${item.target_price}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Status */}
                        <div className="text-right shrink-0 space-y-1">
                          <div className="font-bold text-sm">
                            ${product.current_price?.toFixed(2) ?? "—"}
                          </div>
                          {product.in_stock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                              <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {product.in_stock && product.product_url && (
                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Buy now"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </a>
                          )}
                          {product.product_url && (
                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Open retailer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => removeFromWatchlist(item.product_id)}
                            disabled={isRemoving}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent alerts</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm shrink-0 mt-0.5">{ALERT_ICONS[alert.alert_type] ?? "📢"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 leading-snug">{alert.title}</p>
                      {alert.previous_price && alert.new_price && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          ${alert.previous_price.toFixed(2)} → ${alert.new_price.toFixed(2)}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(alert.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
