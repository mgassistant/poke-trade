"use client";

import { useEffect, useState } from "react";
import {
  Activity, Users, ShoppingBag, Repeat,
  DollarSign, Database, Heart, Shield,
  RefreshCw, Loader2, Server, Star, CheckCircle2, Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthStatus {
  status: string;
  version: string;
  uptime: number;
  checks: Record<string, string>;
  timestamp: string;
}

interface PlatformStats {
  totalUsers: number;
  newUsers: number;
  activeUsers30d: number;
  totalCards: number;
  totalTrades: number;
  activeTrades: number;
  completedTrades: number;
  disputedTrades: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalOrders: number;
  revenue: number;
  activeDropAlerts: number;
  pendingReports: number;
  openDisputes: number;
  avgTrustScore: number;
  verifiedUsers: number;
  verificationRate: number;
  connectAccounts: number;
  totalReviews: number;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SystemDashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/admin/stats"),
      ]);

      if (healthRes.ok) setHealth(await healthRes.json());
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue" },
        { label: "Active (30d)", value: stats.activeUsers30d, icon: Activity, color: "green" },
        { label: "Listings", value: stats.activeListings, icon: ShoppingBag, color: "purple" },
        { label: "Trades", value: stats.totalTrades, icon: Repeat, color: "orange" },
        { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "emerald" },
        { label: "Connect Sellers", value: stats.connectAccounts, icon: Wallet, color: "indigo" },
        { label: "Avg Trust Score", value: stats.avgTrustScore, icon: Star, color: "yellow" },
        { label: "Verification Rate", value: `${stats.verificationRate}%`, icon: CheckCircle2, color: "teal" },
        { label: "Reviews", value: stats.totalReviews, icon: Heart, color: "pink" },
        { label: "Open Disputes", value: stats.openDisputes, icon: Shield, color: "red" },
        { label: "Sold", value: stats.soldListings, icon: ShoppingBag, color: "green" },
        { label: "Completed Trades", value: stats.completedTrades, icon: Repeat, color: "blue" },
      ]
    : [];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    emerald: "bg-emerald-100 text-emerald-600",
    indigo: "bg-indigo-100 text-indigo-600",
    yellow: "bg-yellow-100 text-yellow-600",
    teal: "bg-teal-100 text-teal-600",
    pink: "bg-pink-100 text-pink-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            System Health
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Platform health, stats, and infrastructure monitoring
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* System Health */}
      {health && (
        <Card className={health.status === "healthy" ? "border-green-200" : "border-red-200"}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Infrastructure Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge
                  className={`${
                    health.status === "healthy"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {health.status}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">Status</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{health.version}</p>
                <p className="text-[10px] text-muted-foreground">Version</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{formatUptime(health.uptime)}</p>
                <p className="text-[10px] text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center">
                <Badge
                  className={`text-[10px] ${
                    health.checks.database?.startsWith("ok")
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {health.checks.database}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">Database</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[card.color] || "bg-gray-100 text-gray-600"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
                  <p className="text-lg font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stripe Connect Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Stripe Connect Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-2xl font-bold">{stats.connectAccounts}</p>
                <p className="text-[10px] text-muted-foreground">Connected Sellers</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-2xl font-bold">{stats.soldListings}</p>
                <p className="text-[10px] text-muted-foreground">Total Sales</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Volume</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-[10px] text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
