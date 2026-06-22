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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 transform transition-transform duration-200 lg:translate-x-0 lg:static ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between">
            <Link href="/">
              <Image src="/logo.png" alt="Poké-Trade" width={140} height={42} className="h-10 w-auto" />
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <Separator />

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {sidebarLinks.map((section) => (
              <div key={section.section}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-2">
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
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
          <div className="p-3 border-t border-border/50">
            <div className="glass-card rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">Free Plan</span>
                <Badge variant="outline" className="text-[10px]">Upgrade</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">7/10 free trades used this month</p>
              <div className="h-1.5 bg-muted rounded-full mt-2">
                <div className="h-full bg-primary rounded-full" style={{ width: "70%" }} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center px-4 gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary rounded-full text-[9px] font-bold flex items-center justify-center text-primary-foreground">3</span>
          </Button>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
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
