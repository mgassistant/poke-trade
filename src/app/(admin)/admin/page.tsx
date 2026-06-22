"use client";

import { useEffect, useState } from "react";
import {
  Users, Repeat, ShoppingBag, DollarSign,
  Package, Bell, FileWarning, AlertTriangle,
  TrendingUp, UserPlus, CheckCircle, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalUsers: number;
  newUsers: number;
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
}

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  data: Record<string, any> | null;
  created_at: string;
}

const activityLabels: Record<string, string> = {
  collection_add: "Added card to collection",
  collection_remove: "Removed card from collection",
  listing_created: "Created listing",
  listing_sold: "Listing sold",
  trade_sent: "Sent trade offer",
  trade_received: "Received trade offer",
  trade_completed: "Trade completed",
  want_list_add: "Added to want list",
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
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.activity) setActivity(data.activity);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "New Users (7d)", value: stats?.newUsers || 0, icon: UserPlus, color: "text-green-500", bg: "bg-green-50" },
    { label: "Active Trades", value: stats?.activeTrades || 0, icon: Repeat, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Completed Trades", value: stats?.completedTrades || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Active Listings", value: stats?.activeListings || 0, icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Listings Sold", value: stats?.soldListings || 0, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: stats?.totalOrders || 0, icon: Package, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Revenue", value: `$${(stats?.revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Cards in DB", value: (stats?.totalCards || 0).toLocaleString(), icon: Package, color: "text-blue-400", bg: "bg-blue-50" },
    { label: "Drop Alerts (7d)", value: stats?.activeDropAlerts || 0, icon: Bell, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Pending Reports", value: stats?.pendingReports || 0, icon: FileWarning, color: "text-red-500", bg: "bg-red-50" },
    { label: "Open Disputes", value: stats?.openDisputes || 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and system health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border border-gray-200">
            <CardContent className="pt-5 pb-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Database", status: "operational", detail: `${(stats?.totalCards || 0).toLocaleString()} cards indexed` },
              { label: "Auth System", status: "operational", detail: `${(stats?.totalUsers || 0).toLocaleString()} registered users` },
              { label: "Trading Engine", status: stats && (stats.openDisputes > 5 ? "degraded" : "operational"), detail: `${stats?.activeTrades || 0} active trades` },
              { label: "Marketplace", status: "operational", detail: `${stats?.activeListings || 0} active listings` },
              { label: "Drop Monitor", status: "operational", detail: `${stats?.activeDropAlerts || 0} alerts this week` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.detail}</div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    item.status === "operational"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-yellow-300 text-yellow-700 bg-yellow-50"
                  }`}
                >
                  {item.status === "operational" ? "✓ Operational" : "⚠ Degraded"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
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
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-gray-900">
                        {activityLabels[item.activity_type] || item.activity_type}
                      </p>
                      <p className="text-xs text-gray-400">{formatTime(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Alerts */}
      {stats && (stats.pendingReports > 0 || stats.openDisputes > 0) && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Attention Required</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {stats.pendingReports > 0 && (
                <a
                  href="/admin/reports"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors"
                >
                  <FileWarning className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{stats.pendingReports} Pending Reports</div>
                    <div className="text-xs text-gray-500">Review and resolve user reports</div>
                  </div>
                </a>
              )}
              {stats.openDisputes > 0 && (
                <a
                  href="/admin/trades"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{stats.openDisputes} Open Disputes</div>
                    <div className="text-xs text-gray-500">Resolve trade disputes</div>
                  </div>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
