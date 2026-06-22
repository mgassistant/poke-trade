"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, Package, Truck, CheckCircle, Clock, Loader2, Copy, ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderCard {
  id: string;
  name: string;
  number: string;
  rarity: string;
  image_url: string | null;
  market_value: number | null;
  card_sets: { name: string } | null;
}

interface OrderListing {
  id: string;
  title: string;
  price: number;
  condition: string;
  photos: string[];
  card: OrderCard | null;
}

interface OrderProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  trade_score: number;
}

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  seller_payout: number;
  status: string;
  shipping_tracking: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  listing: OrderListing | null;
  seller: OrderProfile | null;
}

const STATUS_STEPS = [
  { key: "paid", label: "Paid", icon: CheckCircle },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  paid: { label: "Paid", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  shipped: { label: "Shipped", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  delivered: { label: "Delivered", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  completed: { label: "Completed", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  refunded: { label: "Refunded", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  disputed: { label: "Disputed", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

export default function PurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?role=buyer&limit=50");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Check for success param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // Refresh orders after successful checkout
      setTimeout(() => fetchOrders(), 1500);
    }
  }, [fetchOrders]);

  const handleAction = async (orderId: string, action: string) => {
    setActing(orderId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchOrders();
    } catch {
    } finally {
      setActing(null);
    }
  };

  const copyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking).catch(() => {});
  };

  const getStepIndex = (status: string): number => {
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Purchases</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your orders and purchase history
        </p>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No purchases yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              Browse the marketplace to find cards you want!
            </p>
            <Link href="/dashboard/marketplace">
              <Button size="sm" className="gap-2">
                <ShoppingBag className="h-4 w-4" /> Browse Marketplace
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusBadge = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
            const isExpanded = expandedId === order.id;
            const stepIdx = getStepIndex(order.status);

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    {/* Card Image */}
                    <div className="h-16 w-12 rounded-lg overflow-hidden bg-muted relative shrink-0">
                      {order.listing?.card?.image_url ? (
                        <Image
                          src={order.listing.card.image_url}
                          alt={order.listing?.title || "Card"}
                          fill
                          className="object-contain"
                          sizes="48px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{order.listing?.title || "Purchase"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          from {order.seller?.display_name || order.seller?.username || "Seller"}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Price & Status */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">${Number(order.amount).toFixed(2)}</p>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${statusBadge.className}`}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Status Timeline */}
                      <div className="flex items-center gap-0 w-full">
                        {STATUS_STEPS.map((step, idx) => {
                          const isCompleted = idx <= stepIdx;
                          const isCurrent = idx === stepIdx;
                          const Icon = step.icon;

                          return (
                            <div key={step.key} className="flex items-center flex-1">
                              <div className="flex flex-col items-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  isCompleted
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className={`text-[10px] mt-1 ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < STATUS_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 ${idx < stepIdx ? "bg-primary" : "bg-muted"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Tracking */}
                      {order.shipping_tracking && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono flex-1">{order.shipping_tracking}</code>
                            <button
                              onClick={() => copyTracking(order.shipping_tracking!)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Ordered: {new Date(order.created_at).toLocaleString()}</div>
                        {order.shipped_at && <div>Shipped: {new Date(order.shipped_at).toLocaleString()}</div>}
                        {order.delivered_at && <div>Delivered: {new Date(order.delivered_at).toLocaleString()}</div>}
                        {order.completed_at && <div>Completed: {new Date(order.completed_at).toLocaleString()}</div>}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {order.status === "shipped" && (
                          <Button
                            size="sm"
                            onClick={() => handleAction(order.id, "confirm_delivery")}
                            disabled={acting === order.id}
                            className="gap-1"
                          >
                            {acting === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
                            Confirm Delivery
                          </Button>
                        )}
                        {order.status === "delivered" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(order.id, "complete")}
                              disabled={acting === order.id}
                              className="gap-1"
                            >
                              {acting === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Complete Order
                            </Button>
                            <Link href={`/dashboard/reviews?order=${order.id}`}>
                              <Button size="sm" variant="outline" className="gap-1">
                                ⭐ Leave Review
                              </Button>
                            </Link>
                          </>
                        )}
                        {order.status === "completed" && (
                          <Link href={`/dashboard/reviews?order=${order.id}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              ⭐ Leave Review
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
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
