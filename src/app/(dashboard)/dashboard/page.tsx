"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, Wallet, Repeat, Package,
  BarChart3, ArrowUpRight, Bell, Plus, ShoppingBag, Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/hooks/useUser";

interface DashboardStats {
  collectionValue: number;
  totalCards: number;
  activeTrades: number;
  pendingOffers: number;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  data: Record<string, any> | null;
  created_at: string;
}

const activityLabels: Record<string, string> = {
  collection_add: "Added a card to collection",
  collection_remove: "Removed a card from collection",
  listing_created: "Created a new listing",
  listing_sold: "Sold a listing",
  trade_sent: "Sent a trade offer",
  trade_received: "Received a trade offer",
  trade_completed: "Completed a trade",
  want_list_add: "Added a card to want list",
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { profile, loading: userLoading } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.activity) setActivity(data.activity);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Collection Value",
      value: stats ? `$${stats.collectionValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
      icon: Wallet,
      color: "text-blue-400",
    },
    {
      label: "Total Cards",
      value: stats ? stats.totalCards.toLocaleString() : "0",
      icon: Package,
      color: "text-green-400",
    },
    {
      label: "Active Trades",
      value: stats ? stats.activeTrades.toString() : "0",
      icon: Repeat,
      color: "text-purple-400",
    },
    {
      label: "Pending Offers",
      value: stats ? stats.pendingOffers.toString() : "0",
      icon: TrendingUp,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {userLoading ? "Dashboard" : `Welcome back, ${profile?.display_name || profile?.username || "Trainer"}!`}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Your Poké-Trade command center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Add to Collection", icon: Plus, href: "/dashboard/collection", color: "text-blue-400" },
              { label: "Create Listing", icon: ShoppingBag, href: "/dashboard/marketplace", color: "text-green-400" },
              { label: "Browse Marketplace", icon: ArrowUpRight, href: "/marketplace", color: "text-purple-400" },
              { label: "Update Want List", icon: Heart, href: "/dashboard/want-list", color: "text-red-400" },
              { label: "View Portfolio", icon: BarChart3, href: "/dashboard/portfolio", color: "text-yellow-400" },
              { label: "Check Notifications", icon: Bell, href: "/dashboard/notifications", color: "text-red-500" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span>{action.label}</span>
                <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">🎴</div>
                <h3 className="font-semibold mb-1">No activity yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Start by adding cards to your collection or browsing the marketplace.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <Link href="/dashboard/collection">Add Cards</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/marketplace">Browse</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {activityLabels[item.activity_type] || item.activity_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTime(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart Placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Portfolio Value</CardTitle>
          <div className="flex gap-2">
            {["7D", "1M", "3M", "1Y", "ALL"].map((range) => (
              <button
                key={range}
                className="px-2 py-1 text-xs rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {range}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center border border-dashed border-border/50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {stats && stats.totalCards > 0
                  ? `Portfolio value: $${stats.collectionValue.toFixed(2)} — Chart coming soon`
                  : "Add cards to see portfolio value over time"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
