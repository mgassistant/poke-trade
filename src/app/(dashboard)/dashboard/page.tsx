"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, Repeat, ShoppingBag,
  Star, BarChart3, ArrowUpRight, Package, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Collection Value", value: "$0.00", change: "+0%", icon: Wallet, trend: "up" },
  { label: "Active Trades", value: "0", change: null, icon: Repeat, trend: null },
  { label: "Active Listings", value: "0", change: null, icon: ShoppingBag, trend: null },
  { label: "Trade Score", value: "0.0", change: "Rookie Trainer", icon: Star, trend: null },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to your Poké-Trade command center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  {stat.change && stat.trend && (
                    <Badge variant={stat.trend === "up" ? "default" : "destructive"} className="text-[10px]">
                      {stat.change}
                    </Badge>
                  )}
                  {stat.change && !stat.trend && (
                    <span className="text-[10px] text-muted-foreground">{stat.change}</span>
                  )}
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
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
              { label: "Add Cards to Collection", icon: "➕", href: "/dashboard/collection" },
              { label: "Create Trade Offer", icon: "🔄", href: "/dashboard/trades" },
              { label: "List Card for Sale", icon: "🏷️", href: "/dashboard/marketplace" },
              { label: "Browse Marketplace", icon: "🛒", href: "/marketplace" },
              { label: "Update Want List", icon: "❤️", href: "/dashboard/want-list" },
              { label: "Compare Prices", icon: "📊", href: "/compare" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
              >
                <span className="text-lg">{action.icon}</span>
                <span>{action.label}</span>
                <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">🎴</div>
              <h3 className="font-semibold mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Start by adding cards to your collection or browsing the marketplace.
              </p>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <a href="/dashboard/collection">Add Cards</a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="/marketplace">Browse</a>
                </Button>
              </div>
            </div>
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
              <p className="text-sm text-muted-foreground">Add cards to see portfolio value over time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Notifications</CardTitle>
          <Badge variant="outline" className="text-[10px]">0 unread</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
