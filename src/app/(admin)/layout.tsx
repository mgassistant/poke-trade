"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Repeat, ShoppingBag, Shield,
  Bell, FileWarning, Package, Settings, ArrowLeft,
  Menu, X, CheckCircle, BarChart3, Headphones
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const adminLinks = [
  { section: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "Management", items: [
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/trades", label: "Trades", icon: Repeat },
    { href: "/admin/listings", label: "Listings", icon: ShoppingBag },
  ]},
  { section: "Operations", items: [
    { href: "/admin/shop", label: "Shop", icon: ShoppingBag },
    { href: "/admin/verification", label: "Verification", icon: CheckCircle },
    { href: "/admin/disputes", label: "Disputes", icon: FileWarning },
    { href: "/admin/support", label: "Support", icon: Headphones },
    { href: "/admin/drops", label: "Drop Products", icon: Package },
    { href: "/admin/insurance", label: "Insurance Leads", icon: Shield },
    { href: "/admin/reports", label: "Reports", icon: FileWarning },
  ]},
  { section: "Content", items: [
    { href: "/admin/content", label: "Content", icon: Settings },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.push("/");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => router.push("/"));
  }, [router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-400" />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 pb-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Main Site
            </Link>
          </div>

          <Separator className="bg-gray-700" />

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {adminLinks.map((section) => (
              <div key={section.section}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
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
                            ? "bg-red-600/20 text-red-400 font-medium"
                            : "text-gray-300 hover:text-white hover:bg-gray-800"
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
          <div className="p-3 border-t border-gray-700">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3 w-3 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">Admin Mode</span>
              </div>
              <p className="text-[10px] text-gray-400">All actions are logged</p>
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
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="font-semibold text-sm text-gray-900">Poké-Trade Admin</span>
          </div>
          <div className="flex-1" />
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Main Site
            </Button>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
