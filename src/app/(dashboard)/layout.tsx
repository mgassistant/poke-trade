"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, ShoppingBag, Repeat, Heart,
  BarChart3, MessageSquare, Bell, Settings, Shield,
  Star, History, CreditCard, LogOut, Menu, X,
  Package, Gavel, Store, BookOpen, Sparkles, Headphones
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/lib/hooks/useUser";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notificationIcon(type: string) {
  if (type.includes('restock')) return '🟢';
  if (type.includes('price')) return '📉';
  if (type.includes('trade')) return '🔄';
  if (type.includes('order')) return '📦';
  return '🔔';
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications((data.notifications || []).slice(0, 10));
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', notification_id: id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] text-gray-500">{unreadCount} unread</span>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${
                    !n.read_at ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => { if (!n.read_at) markRead(n.id); }}
                >
                  <span className="text-lg shrink-0 mt-0.5">{notificationIcon(n.notification_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">{n.title}</div>
                    <div className="text-[11px] text-gray-500 truncate">{n.message}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{formatTimeAgo(n.created_at)}</div>
                  </div>
                  {!n.read_at && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
          <a
            href="/dashboard/notifications"
            className="block text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-2.5 border-t border-gray-100"
          >
            View All Notifications
          </a>
        </div>
      )}
    </div>
  );
}

const sidebarLinks = [
  { section: "Overview", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "Trading", items: [
    { href: "/dashboard/trades", label: "My Trades", icon: Repeat },
    { href: "/dashboard/offers", label: "Trade Offers", icon: Package },
    { href: "/dashboard/marketplace", label: "My Listings", icon: ShoppingBag },
    { href: "/dashboard/trade-floor", label: "Trade Floor", icon: Store },
  ]},
  { section: "Collection", items: [
    { href: "/dashboard/collection", label: "My Collection", icon: Wallet },
    { href: "/dashboard/collection/binder", label: "My Binder", icon: BookOpen },
    { href: "/dashboard/portfolio", label: "Portfolio", icon: BarChart3 },
    { href: "/dashboard/want-list", label: "Want List", icon: Heart },
  ]},
  { section: "Community", items: [
    { href: "/dashboard/showcase", label: "Showcase", icon: Sparkles },
  ]},
  { section: "Drops", items: [
    { href: "/dashboard/drops", label: "Drop Alerts", icon: Bell, badge: "PRO" },
  ]},
  { section: "Activity", items: [
    { href: "/dashboard/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/dashboard/purchases", label: "Purchases", icon: CreditCard },
    { href: "/dashboard/sales", label: "Sales", icon: History },
    { href: "/dashboard/reviews", label: "Reviews", icon: Star },
    { href: "/dashboard/trust-score", label: "Trust Score", icon: Shield },
    { href: "/dashboard/disputes", label: "Disputes", icon: Gavel },
  ]},
  { section: "Account", items: [
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/support", label: "Support Tickets", icon: Headphones },
    { href: "/dashboard/membership", label: "Membership", icon: Shield },
    { href: "/dashboard/protection", label: "Protection", icon: Shield },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useUser();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between">
            <Link href="/">
              <Image src="/logo.png" alt="Poké-Trade" width={140} height={42} className="h-10 w-auto" />
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <Separator className="bg-gray-200" />

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {sidebarLinks.map((section) => (
              <div key={section.section}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">
                  {section.section}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const sidebarItem = item as typeof item & { badge?: string };
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-red-50 text-red-600 font-medium"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        {sidebarItem.badge && !profile?.drop_alerts_active && (
                          <Badge className="ml-auto text-[8px] bg-amber-100 text-amber-700 border-amber-200 px-1.5 py-0">
                            {sidebarItem.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Admin Link */}
          {profile?.is_admin && (
            <div className="px-3 pb-2">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Shield className="h-4 w-4 shrink-0" />
                Admin Panel
              </Link>
            </div>
          )}

          {/* Bottom */}
          <div className="p-3 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-900">Free Plan</span>
                <Badge variant="outline" className="text-[10px]">Upgrade</Badge>
              </div>
              <p className="text-[10px] text-gray-500">7/10 free trades used this month</p>
              <div className="h-1.5 bg-gray-200 rounded-full mt-2">
                <div className="h-full bg-red-500 rounded-full" style={{ width: "70%" }} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
            U
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
