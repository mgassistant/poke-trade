"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell, Check, CheckCheck, Repeat, ShoppingBag,
  TrendingUp, Info, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationData {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; href?: string }> = {
  trade_offer: { icon: Repeat, color: "text-purple-400", href: "/dashboard/offers" },
  listing_sold: { icon: ShoppingBag, color: "text-green-400", href: "/dashboard/sales" },
  price_alert: { icon: TrendingUp, color: "text-yellow-400", href: "/dashboard/portfolio" },
  system: { icon: Info, color: "text-blue-400" },
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
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notification_id: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch {
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
    } catch {
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAll ? "Marking..." : "Mark All Read"}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No notifications yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              You&apos;ll receive notifications when someone sends you a trade offer, buys your listing, or when prices change.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = typeConfig[notif.notification_type] || typeConfig.system;
            const Icon = config.icon;
            const isUnread = !notif.read_at;

            const content = (
              <Card className={`transition-colors ${isUnread ? "border-primary/20 bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      isUnread ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm ${isUnread ? "font-semibold" : "font-medium"} truncate`}>
                          {notif.title}
                        </h3>
                        {isUnread && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">{formatTime(notif.created_at)}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {notif.notification_type.replace("_", " ")}
                        </Badge>
                        {isUnread && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarkRead(notif.id); }}
                            className="text-[10px] text-primary hover:underline ml-auto flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            if (config.href) {
              return (
                <Link key={notif.id} href={config.href} className="block">
                  {content}
                </Link>
              );
            }

            return <div key={notif.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}
