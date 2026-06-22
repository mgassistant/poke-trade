"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, ShoppingBag, Repeat, Heart,
  BarChart3, MessageSquare, Bell, Settings, Shield,
  Star, History, CreditCard, LogOut, Menu, X,
  Package, Gavel
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const sidebarLinks = [
  { section: "Overview", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "Trading", items: [
    { href: "/dashboard/trades", label: "My Trades", icon: Repeat },
    { href: "/dashboard/offers", label: "Trade Offers", icon: Package },
    { href: "/dashboard/marketplace", label: "My Listings", icon: ShoppingBag },
  ]},
  { section: "Collection", items: [
    { href: "/dashboard/collection", label: "My Collection", icon: Wallet },
    { href: "/dashboard/portfolio", label: "Portfolio", icon: BarChart3 },
    { href: "/dashboard/want-list", label: "Want List", icon: Heart },
  ]},
  { section: "Drops", items: [
    { href: "/dashboard/drops", label: "Drop Alerts", icon: Bell },
  ]},
  { section: "Activity", items: [
    { href: "/dashboard/purchases", label: "Purchases", icon: CreditCard },
    { href: "/dashboard/sales", label: "Sales", icon: History },
    { href: "/dashboard/reviews", label: "Reviews", icon: Star },
    { href: "/dashboard/disputes", label: "Disputes", icon: Gavel },
  ]},
  { section: "Account", items: [
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/membership", label: "Membership", icon: Shield },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

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
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">3</span>
          </Button>
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
